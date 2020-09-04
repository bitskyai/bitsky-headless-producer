const Baseservice = require("@bitskyai/producer-sdk");
const _ = require("lodash");
const { headlessWorker, resetHeadlessWorker } = require("./workers/headlessWorker");
const { getAgentConfigs } = require("./utils");

let __baseservice = undefined;

module.exports = {
  startServer: async function startServer(
    configs,
    exprssOptions,
    indexOptions
  ) {
    try {
      await resetHeadlessWorker();
      // get default configurations
      const defaultConfigs = getAgentConfigs();
      // merge with customer configs
      configs = _.merge({}, defaultConfigs, configs);
       __baseservice = new Baseservice(configs);
       __baseservice.setConfigs(configs);
       __baseservice.express(exprssOptions || {});
       __baseservice.type("HEADLESSBROWSER");
       __baseservice.worker(headlessWorker);
       __baseservice.routers(indexOptions || {});
      await __baseservice.listen();
    } catch (err) {
      throw err;
    }
  },
  stopServer: async function stopServer() {
    try {
      await __baseservice.stop();
      await resetHeadlessWorker();
      __baseservice = undefined;
    } catch (err) {
      throw err;
    }
  },
};
