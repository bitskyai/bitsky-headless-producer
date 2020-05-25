const { headlessWorker } = require("./workers/headlessWorker");
const { getConfigs } = require("./utils");
const baseservice = require("bitspider-agent-baseservice");
baseservice.express();
baseservice.type("HEADLESSBROWSER");
baseservice.worker(headlessWorker);
baseservice.listen(getConfigs()['PORT']);
