const puppeteer = require("puppeteer");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const { getAgentConfigs } = require("../utils");

let __browser;

function setIntelligencesToFail(intelligence, err) {
  _.set(intelligence, "system.state", "FAILED");
  _.set(intelligence, "system.agent.endedAt", Date.now());
  _.set(intelligence, "system.failuresReason", _.get(err, "message"));

  return intelligence;
}

async function screenshot(page, jobId, globalId, screenshotFolder, logger) {
  try {
    logger.debug(`screenshot -> screenshotFolder: ${screenshotFolder}`, {
      jobId,
    });
    if (!fs.existsSync(screenshotFolder)) {
      fs.mkdirSync(screenshotFolder, { recursive: true });
    }
    let screenshotPath = path.join(
      screenshotFolder,
      `${Date.now()}-${globalId}.png`
    );
    logger.debug(`screenshot -> screenshotPath: ${screenshotPath}`, {
      jobId,
    });
    await page.screenshot({
      fullPage: true,
      path: screenshotPath,
    });
    logger.debug(
      `Capture screenshot success. screenshotPath: ${screenshotPath}`,
      {
        jobId,
      }
    );
  } catch (err) {
    logger.error(`Capture screenshot fail. Error: ${err.message}`, {
      jobId,
      error: err,
    });
  }
}

function getChromiumExecPath() {
  return puppeteer.executablePath().replace("app.asar", "app.asar.unpacked");
}

async function headlessWorker(options) {
  const jobId = _.get(options, "jobId");
  const logger = _.get(options, "context.logger");
  const intelligences = _.get(options, "intelligences");
  try {
    if (!intelligences || !intelligences.length) {
      if (__browser) {
        logger.debug(`intelligences length is ${intelligences.length}`);
        await __browser.close();
        __browser = undefined;
      }
      return [];
    }
    const configs = options.context.baseservice.getConfigs();
    if (!__browser) {
      logger.debug(`browser isn't inited. headless: ${configs["HEADLESS"]}`, {
        jobId: jobId,
      });
      let executablePath = _.get(configs, "PUPPETEER_EXECUTABLE_PATH");
      if (
        executablePath === "undefined" ||
        executablePath === "null" ||
        executablePath === ""
      ) {
        executablePath = getChromiumExecPath();
      }

      let userDataDir = _.get(configs, "PUPPETEER_USER_DATA_DIR");
      if (
        userDataDir === "undefined" ||
        userDataDir === "null" ||
        userDataDir === ""
      ) {
        userDataDir = undefined;
      }

      let args = ["--no-sandbox", "--disable-setuid-sandbox"];
      let ignoreDefaultArgs = false;
      if (userDataDir) {
        // args = [
        //   "--disable-background-networking",
        //   "--enable-features=NetworkService,NetworkServiceInProcess",
        //   "--disable-background-timer-throttling",
        //   "--disable-backgrounding-occluded-windows",
        //   "--disable-breakpad",
        //   "--disable-client-side-phishing-detection",
        //   "--disable-component-extensions-with-background-pages",
        //   "--disable-default-apps",
        //   "--disable-dev-shm-usage",
        //   "--disable-features=TranslateUI",
        //   "--disable-hang-monitor",
        //   "--disable-ipc-flooding-protection",
        //   "--disable-popup-blocking",
        //   "--disable-prompt-on-repost",
        //   "--disable-renderer-backgrounding",
        //   "--disable-sync",
        //   "--metrics-recording-only",
        //   "--enable-automation",
        //   "--no-first-run",
        //   "--no-sandbox",
        //   "--disable-setuid-sandbox",
        //   "--flag-switches-begin",
        //   "--flag-switches-end",
        //   "--enable-audio-service-sandbox",
        //   `--user-data-dir=${userDataDir}`,
        // ];
        args = [
          "--disable-breakpad",
          "--no-first-run",
          "--flag-switches-begin",
          "--flag-switches-end",
          "--enable-audio-service-sandbox",
          `--user-data-dir=${userDataDir}`,
        ];
        if(_.get(configs, "HEADLESS")){
          args.push("--headless");
        }
        ignoreDefaultArgs = true;
      }

      logger.debug(`Chrome Executeable Path: ${executablePath}`);
      const params = {
        args: args,
        ignoreDefaultArgs,
        headless: _.get(configs, "HEADLESS"),
        defaultViewport: null,
        executablePath,
      };
      __browser = await puppeteer.launch(params);
      logger.debug(`Puppeteer launch browser successful`, {
        jobId: jobId,
      });
    }
    let screenshotFolder;
    if (configs["AGENT_HOME"]) {
      screenshotFolder = path.join(configs["AGENT_HOME"], "screenshots");
    } else {
      let publicFolder = _.get(
        options,
        "context.baseservice.getDefaultPublic()"
      );
      screenshotFolder = path.join(publicFolder, "screenshots");
    }

    logger.debug(`screenshotFolder: ${screenshotFolder}`, {
      jobId: jobId,
    });

    let pages = await __browser.pages();
    const promises = [];
    for (let i = 0; i < intelligences.length; i++) {
      let intelligence = intelligences[i];
      let page = pages[i];
      promises.push(
        (function (page, intelligence) {
          return new Promise(async (resolve, reject) => {
            try {
              if (!page) {
                page = await __browser.newPage();
              }
              logger.debug(`intelligence URL: ${intelligence.url}`, {
                jobId: jobId,
              });
              await page.goto(intelligence.url);
              let functionBody = "";
              // Check whether this intelligence need to execute custom script
              if (
                intelligence &&
                intelligence.metadata &&
                intelligence.metadata.script
              ) {
                functionBody = intelligence.metadata.script;
              }
              if (functionBody) {
                // if it has custom function, then in custom function will return collected intelligence
                logger.debug(`Start run custom function.`, {
                  jobId: jobId,
                });
                let dataset;
                try {
                  dataset = await customFun(page, functionBody, intelligence);
                } catch (err) {
                  // by design, when throw error or reject, both will return an Error object
                  dataset = err;
                }
                if (dataset instanceof Error) {
                  logger.debug(
                    `Evaluate customFun fail. Error: ${dataset.message}`,
                    {
                      jobId: jobId,
                      error: dataset,
                    }
                  );
                  setIntelligencesToFail(intelligence, dataset);
                } else {
                  logger.debug(`Evaluate customFun success.`, {
                    jobId: jobId,
                  });
                  // also update intelligence state
                  intelligence.system.state = "FINISHED";
                  intelligence.system.agent.endedAt = Date.now();
                  intelligence.dataset = dataset;
                }
              } else {
                logger.debug(`No customFun`, {
                  jobId: jobId,
                });
                // otherwise default collect currently page
                try {
                  const content = await page.$eval("html", (elem) => {
                    return elem && elem.innerHTML;
                  });
                  intelligence.dataset = {
                    url: page.url(),
                    data: {
                      contentType: "html",
                      content: content,
                    },
                  };
                  intelligence.system.state = "FINISHED";
                  intelligence.system.agent.endedAt = Date.now();
                  logger.debug(`Execute intelligence successful `, {
                    jobId: jobId,
                  });
                } catch (err) {
                  setIntelligencesToFail(intelligence, err);
                  logger.debug(`Execute intelligence fail`, {
                    jobId: jobId,
                  });
                }
              }

              if (configs["SCREENSHOT"]) {
                await screenshot(
                  page,
                  jobId,
                  _.get(intelligence, "globalId"),
                  screenshotFolder,
                  logger
                );
              }
              logger.debug(
                `Execute intlligence - ${intelligence.globalId} successful`,
                {
                  jobId: jobId,
                }
              );
              resolve(intelligence);
            } catch (err) {
              logger.error(
                `collect intelligence fail. globalId: ${intelligence.globalId}. Error: ${err.message}`
              );
              setIntelligencesToFail(intelligence, err);
              if (configs["SCREENSHOT"]) {
                await screenshot(
                  page,
                  jobId,
                  _.get(intelligence, "globalId"),
                  screenshotFolder,
                  logger
                );
              }
              reject(intelligence);
            }
          });
        })(page, intelligence)
      );
    }

    return promises;
  } catch (err) {
    logger.error(`headlessWorker fail, error: ${err.message}`, {
      jobId: jobId,
      error: err,
    });
    return [];
  }
}

/**
 * Custom function that created by SOI.
 *
 * TODO: Need to improve security
 * @param {string} functionBody - function body
 * @param {object} intelligence - intelligence object
 *
 * @return {object|Error} - return collected intelligences or error
 */
async function customFun(page, functionBody, intelligence) {
  try {
    const configs = getAgentConfigs();
    const dataset = await page.evaluate(
      function (intelligence, functionBody, TIMEOUT) {
        return new Promise((resolve, reject) => {
          try {
            // if passed functionBody contains function () {  }, remove it.
            let match = functionBody
              .toString()
              .match(/function[^{]+\{([\s\S]*)\}$/);
            if (match) {
              functionBody = match[1];
            }
            let fun = new Function(
              "resolve",
              "reject",
              "intelligence",
              functionBody
            );

            // TODO: Need to think about how to avoid custom script run too long
            // https://github.com/munew/dia-agents-browserextensions/issues/16
            fun(resolve, reject, intelligence);
            setTimeout(() => {
              reject(new Error("customFun evaluate timeout"));
            }, TIMEOUT);
          } catch (err) {
            // if it isn't an error object, then create an error object
            if (!(err instanceof Error)) {
              err = new Error(err);
            }
            reject(err);
          }
        });
      },
      intelligence,
      functionBody,
      configs["CUSTOM_FUNCTION_TIMEOUT"]
    );
    if (dataset instanceof Error) {
      throw dataset;
    }
    return dataset;
  } catch (err) {
    // if it isn't an error object, then create an error object
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
    throw err;
  }
}

async function resetHeadlessWorker() {
  if (__browser) {
    await __browser.close();
    __browser = undefined;
  }
}

module.exports = {
  headlessWorker,
  resetHeadlessWorker,
};
