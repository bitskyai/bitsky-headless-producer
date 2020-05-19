const { headlessCrawler } = require("./crawlers/headlessCrawler");
const baseservice = require("dia-agent-baseservice");
baseservice.express();
baseservice.type("HEADLESSBROWSER");
baseservice.worker(headlessCrawler);
baseservice.listen();
