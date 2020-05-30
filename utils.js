/* eslint-disable no-process-env */
// Env vars should be casted to correct types

// Get Specific Agent Configuration
function getAgentConfigs() {
  try {
    let configs = {
      // Defualt you don't need change it, only change when you know how,
      // otherwise, keep it as default
      CUSTOM_FUNCTION_TIMEOUT:
        process.env.CUSTOM_FUNCTION_TIMEOUT || 1 * 60 * 1000, // Timeout value for a customFun call
    };

    if (process.env.SCREENSHOT_FOLDER) {
      configs.SCREENSHOT_FOLDER = process.env.SCREENSHOT_FOLDER;
    }

    if(process.env.AGENT_HOME){
      configs.AGENT_HOME = process.env.AGENT_HOME;
    }

    if (process.env.HEADLESS === "false" || process.env.HEADLESS === false) {
      configs.HEADLESS = false;
    } else {
      configs.HEADLESS = true;
    }

    if (process.env.SCREENSHOT === "true" || process.env.SCREENSHOT === true) {
      configs.SCREENSHOT = true;
    } else {
      configs.SCREENSHOT = false;
    }

    return configs;
  } catch (err) {
    console.error("headless->getConfigs fail!", err);
  }
}

module.exports = {
  getAgentConfigs,
};
