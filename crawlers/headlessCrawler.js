const puppeteer = require("puppeteer");
const _ = require("lodash");
const logger = require("dia-agent-baseservice/lib/utils/logger");
const { getConfigs } = require("../utils");

let __browser;

function setIntelligencesToFail(intelligence, err) {
  _.set(intelligence, "system.state", "FAILED");
  _.set(intelligence, "system.agent.endedAt", Date.now());
  _.set(intelligence, "system.failuresReason", _.get(err, "message"));

  return intelligence;
}

async function headlessCrawler(intelligences, jobId, agentConfiguration) {
  try {
    const configs = getConfigs();
    if (!__browser) {
      const params = {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: configs["HEADLESS"],
        defaultViewport: null,
      };
      __browser = await puppeteer.launch(params);
    }
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
                let dataset = await customFun(page, functionBody, intelligence);
                if (dataset instanceof Error) {
                  setIntelligencesToFail(intelligence, err);
                } else {
                  // also update intelligence state
                  intelligence.system.state = "FINISHED";
                  intelligence.system.agent.endedAt = Date.now();
                  intelligence.dataset = dataset;
                }
              } else {
                // otherwise default collect currently page
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
              }
              resolve(intelligence);
            } catch (err) {
              logger.error(
                `collect intelligence fail. globalId: ${intelligence.globalId}. Error: ${err.message}`
              );
              setIntelligencesToFail(intelligence, err);
              reject(intelligence);
            }
          });
        })(page, intelligence)
      );
    }

    return promises;
  } catch (err) {
    logger.error(`headlessCrawler fail, error: ${err.message}`, {
      jobId: jobId,
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
    const configs = getConfigs();
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
    // logger.info(
    //   `customFun fail. intelligence globalId: ${intelligence.globalId}. Error: ${err.message}`
    // );
    throw err;
  }
}

module.exports = {
  headlessCrawler,
};
