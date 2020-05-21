const { headlessCrawler } = require("./workers/headlessWorker");
const baseservice = require("bitspider-agent-baseservice");
baseservice.express();
baseservice.type("HEADLESSBROWSER");
baseservice.worker(headlessCrawler);
baseservice.listen();
