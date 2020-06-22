const { getConfigs } = require("./agentConfigs");

// Get Specific Agent Configuration
function getAgentConfigs() {
  try {
    let configs = getConfigs(); 
    configs.PORT = Number(process.env.HEADLESS_PORT) || 8090; // server port number
  
    return configs;
  } catch (err) {
    console.error("headless->getConfigs fail!", err);
  }
}

module.exports = {
  getAgentConfigs,
};
