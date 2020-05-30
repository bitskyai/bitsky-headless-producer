/* eslint-disable no-process-env */
// Env vars should be casted to correct types

// Get Analyst Service Configuration
function getConfigs() {
  try {
    let configs = {
      PORT: Number(process.env.HEADLESS_PORT) || 8090, // server port number
    };

    return configs;
  } catch (err) {}
}

module.exports = {
  getConfigs,
};
