const puppeteer = require("puppeteer");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const { NodeVM } = require("vm2");
// const { getProducerConfigs } = require("../utils");
const { setIntelligencesToFail } = require('@bitskyai/producer-sdk/lib/utils');

let __browser;

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
    const baseservice = _.get(options, "context.baseservice");
    const configs = baseservice.getConfigs();
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
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-breakpad",
          "--no-first-run",
          // "--flag-switches-begin",
          // "--flag-switches-end",
          "--enable-audio-service-sandbox",
          `--user-data-dir=${userDataDir}`,
        ];
        if (_.get(configs, "HEADLESS")) {
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
    if (configs["PRODUCER_HOME"]) {
      screenshotFolder = path.join(configs["PRODUCER_HOME"], "screenshots");
    } else {
      const publicFolder = baseservice.getDefaultPublic();
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
              let code = "";
              let dataset, datasetError;
              // Check whether this intelligence need to execute custom script
              if (
                intelligence &&
                intelligence.metadata &&
                intelligence.metadata.script
              ) {
                code = intelligence.metadata.script;
              }

              // execute custom code first
              if (code) {
                // if it has custom function, then in custom function will return collected intelligence
                logger.debug(`Start run custom function.`, {
                  jobId: jobId,
                });
                try {
                  // dataset = await customFun(page, functionBody, intelligence);
                  dataset = await sandboxVM({
                    page,
                    task: _.cloneDeep(intelligence), // to avoid user change intelligence
                    code,
                    logger
                  });
                } catch (err) {
                  // by design, when throw error or reject, both will return an Error object
                  datasetError = err;
                }

                if (datasetError) {
                  logger.debug(
                    `Evaluate customFun fail. Error: ${_.get(
                      datasetError,
                      "message"
                    )}`,
                    {
                      jobId: jobId,
                      error: datasetError,
                    }
                  );
                  setIntelligencesToFail(intelligence, datasetError);
                } else if (dataset !== undefined && dataset !== null) {
                  logger.debug(`Evaluate customFun success.`, {
                    jobId: jobId,
                  });
                  // also update intelligence state
                  intelligence.system.state = "FINISHED";
                  intelligence.system.producer.endedAt = Date.now();
                  intelligence.dataset = dataset;
                }
              }

              // Following case need to get whole page
              // 1. if no `code`. Default is get whole page and send back
              // 2. it has `code`, but not dataset collected and no error happen. This means `code` isn't for collect data, just want to wait or do some operation
              if (
                !code ||
                ((dataset === undefined || dataset === null) && !datasetError)
              ) {
                logger.debug(`Need to get whole page and send back`, {
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
                  intelligence.system.producer.endedAt = Date.now();
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

async function sandboxVM({ page, task, code, logger }) {
  try {
    const sandbox = {
      $$page: page,
      $$task: task,
      $$_: _,
      $$logger: logger
    };
    const vm = new NodeVM({
      eval: false,
      wasm: false,
      require: true,
      // to avoid conflit, add $ as prefix
      sandbox,
    });
    // don't allow user to change global variable
    vm.freeze(page, "$$page");
    vm.freeze(task, "$$task");
    vm.freeze(_, "$$_");
    vm.freeze(_, "$$logger");

    const wrapper = vm.run(
      `
      module.exports = async function wrapper(resolve, reject, sandbox) {
        try{
          const result = await (${code})(sandbox);
          resolve(result);
        }catch(err){
          sandbox.$$logger.error('Headless Worker -> sandboxVM fail',{error: err, task: sandbox.$$task});
          reject(err);
        }
      }
      `
    );

    const result = await new Promise((resolve, reject) => {
      wrapper(resolve, reject, sandbox);
    });

    return result;
  } catch (err) {
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
