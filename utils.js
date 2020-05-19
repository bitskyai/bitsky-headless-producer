/* eslint-disable no-process-env */
// Env vars should be casted to correct types

// Get Analyst Service Configuration
function getConfigs() {
  try {
    let configs = {
      MUNEW_BASE_URL: process.env.MUNEW_BASE_URL,
      MUNEW_SECURITY_KEY: process.env.MUNEW_SECURITY_KEY,
      GLOBAL_ID: process.env.GLOBAL_ID,
      PORT: Number(process.env.PORT) || 8090, // server port number
      SERVICE_NAME: process.env.SERVICE_NAME || "MUNEW-AGENTS-HEADLESS",
      AGENT_TYPE: process.env.AGENT_TYPE || "HEADLESSBROWSER",

      // Defualt you don't need change it, only change when you know how,
      // otherwise, keep it as default
      NODE_ENV: process.env.NODE_ENV || "development",
      LOG_LEVEL: process.env.LOG_LEVEL || "info",
      CUSTOM_FUNCTION_TIMEOUT:
        process.env.CUSTOM_FUNCTION_TIMEOUT || 1 * 60 * 1000, // Timeout value for a customFun call
    };

    if (process.env.HEADLESS === 'false' || process.env.HEADLESS === false) {
      configs.HEADLESS = false;
    } else {
      configs.HEADLESS = true;
    }

    if (!configs.MUNEW_BASE_URL) {
      console.warn(
        "You must set `MUNEW_BASE_URL` by `process.env.MUNEW_BASE_URL`. "
      );
    }

    if (!configs.GLOBAL_ID) {
      console.warn("You must set `GLOBAL_ID` by `process.env.GLOBAL_ID` ");
    }

    return configs;
  } catch (err) {}
}

module.exports = {
  getConfigs,
};
