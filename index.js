const { headlessCrawler } = require("./crawlers/headlessCrawler");
const baseservice = require("dia-agents-baseservice");
baseservice.express();
baseservice.type("HEADLESSBROWSER");
baseservice.worker(headlessCrawler);
baseservice.listen();
