const { headlessWorker } = require("./workers/headlessWorker");
const baseservice = require("bitspider-agent-baseservice");
baseservice.express();
baseservice.type("HEADLESSBROWSER");
baseservice.worker(headlessWorker);
baseservice.listen();
