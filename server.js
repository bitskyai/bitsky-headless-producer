const Baseservice = require("bitspider-agent-baseservice");
const _ = require("lodash");
const { headlessWorker } = require("./workers/headlessWorker");
const { getAgentConfigs } = require("./utils");

let server = undefined;

module.exports = {
  startServer: async function startServer(
    configs,
    exprssOptions,
    indexOptions
  ) {
    try {
      // get default configurations
      const defaultConfigs = getAgentConfigs();
      // merge with customer configs
      configs = _.merge({}, defaultConfigs, configs);
      const baseservice = new Baseservice(configs);
      baseservice.express(exprssOptions || {});
      baseservice.type("HEADLESSBROWSER");
      baseservice.worker(headlessWorker);
      baseservice.routers(indexOptions || {});
      server = baseservice.listen();
    } catch (err) {
      throw err;
    }
  },
  stopServer: async function stopServer() {
    try {
      server.destroy();
      server = undefined;
    } catch (err) {
      throw err;
    }
  },
};
