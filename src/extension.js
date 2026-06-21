const vscode = require('vscode');
const { initCache } = require('./cache');
const { initLocation, autoDetectLocation } = require('./location');
const { registerCommands } = require('./commands');
const {
  showItem,
  disposeItem,
  updateMaps,
  updateText,
} = require('./notifications');

async function activate(context) {
  initCache(context);
  initLocation(context);

  autoDetectLocation().then(() => updateMaps()).then(() => {
    updateText();
  });

  showItem();

  registerCommands(context);
}

function deactivate() {
  vscode.window.showInformationMessage('لا خير في عملٍ يلهي عن الصلاة');
  vscode.window.showInformationMessage('Prayer Reminder: Deactivated');
  disposeItem();
}

module.exports = {
  activate,
  deactivate,
};
