const vscode = require('vscode');
const axios = require('axios');
const { LOCATION_DETECTED_KEY } = require('./constants');
const {
  getSettings,
  hasConfiguredLocation,
  getDetectedMethod,
} = require('./utils');

let extensionContext;

const initLocation = (context) => {
  extensionContext = context;
};

const detectLocation = async () => {
  const res = await axios.get('http://ip-api.com/json/', {
    timeout: 5000,
  });
  const { status, city, country } = res.data;

  if (status !== 'success' || !city || !country) {
    throw new Error('Location detection did not return a city and country.');
  }

  return {
    city,
    country,
    method: getDetectedMethod(country),
  };
};

const applyDetectedLocation = async (location) => {
  const config = vscode.workspace.getConfiguration('prayerReminder');

  await config.update('city', location.city, vscode.ConfigurationTarget.Global);
  await config.update('country', location.country, vscode.ConfigurationTarget.Global);
  await config.update('method', location.method, vscode.ConfigurationTarget.Global);

  if (extensionContext) {
    await extensionContext.globalState.update(LOCATION_DETECTED_KEY, true);
  }
};

const autoDetectLocation = async () => {
  if (hasConfiguredLocation()) return false;

  try {
    const location = await detectLocation();
    await applyDetectedLocation(location);

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  initLocation,
  detectLocation,
  applyDetectedLocation,
  autoDetectLocation,
};
