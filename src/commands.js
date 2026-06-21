const vscode = require('vscode');
const { calculationMethods } = require('./constants');
const { getSettings } = require('./utils');
const { detectLocation, applyDetectedLocation } = require('./location');
const { openAdhkarPanel, adhkarSabahHTML, adhkarMasaHTML } = require('./adhkar');
const {
  updateMaps,
  updateText,
  setLoadingText,
} = require('./notifications');

const refreshAfterConfigChange = async () => {
  const updated = await updateMaps(true);
  await updateText();

  if (updated) {
    vscode.window.showInformationMessage('Prayer Reminder: Settings updated');
  }
};

const configurePrayerTimes = async () => {
  const config = vscode.workspace.getConfiguration('prayerReminder');
  const settings = getSettings();

  const city = await vscode.window.showInputBox({
    title: 'Prayer Reminder: City',
    prompt: 'Enter the city used to calculate prayer times.',
    value: settings.city,
    ignoreFocusOut: true,
  });

  if (!city) return;

  const country = await vscode.window.showInputBox({
    title: 'Prayer Reminder: Country',
    prompt: 'Enter the country used to calculate prayer times.',
    value: settings.country,
    ignoreFocusOut: true,
  });

  if (!country) return;

  const method = await vscode.window.showQuickPick(
    calculationMethods.map((calculationMethod) => ({
      label: `${calculationMethod.id} - ${calculationMethod.name}`,
      description:
        calculationMethod.id === settings.method ? 'Current method' : undefined,
      methodId: calculationMethod.id,
    })),
    {
      title: 'Prayer Reminder: Calculation Method',
      placeHolder: 'Select the calculation method for your location.',
      ignoreFocusOut: true,
    }
  );

  if (!method) return;

  await config.update('city', city.trim(), vscode.ConfigurationTarget.Global);
  await config.update('country', country.trim(), vscode.ConfigurationTarget.Global);
  await config.update(
    'method',
    method.methodId,
    vscode.ConfigurationTarget.Global
  );
  await refreshAfterConfigChange();
};

const detectLocationAndRefresh = async () => {
  try {
    setLoadingText();

    const location = await detectLocation();
    await applyDetectedLocation(location);
    const updated = await updateMaps(true);
    await updateText();

    if (updated) {
      vscode.window.showInformationMessage(
        `Prayer Reminder: Location set to ${location.city}, ${location.country}`
      );
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      'Prayer Reminder: Could not detect your location. Please configure it manually.'
    );
    await configurePrayerTimes();
  }
};

const registerCommands = (context) => {
  const refresh = vscode.commands.registerCommand(
    'prayerReminder.refresh',
    async () => {
      const updated = await updateMaps(true);
      await updateText();

      if (updated) {
        vscode.window.showInformationMessage('Prayer Reminder: Refreshed');
      }
    }
  );
  const configure = vscode.commands.registerCommand(
    'prayerReminder.configure',
    configurePrayerTimes
  );
  const detect = vscode.commands.registerCommand(
    'prayerReminder.detectLocation',
    detectLocationAndRefresh
  );
  const adhkarSabah = vscode.commands.registerCommand(
    'prayerReminder.openAdhkarSabah',
    () => openAdhkarPanel('أذكار الصباح', adhkarSabahHTML)
  );
  const adhkarMasa = vscode.commands.registerCommand(
    'prayerReminder.openAdhkarMasa',
    () => openAdhkarPanel('أذكار المساء', adhkarMasaHTML)
  );

  // update the status bar item every minute
  const interval = setInterval(() => {
    updateText();
  }, 60000);

  context.subscriptions.push(refresh, configure, detect, adhkarSabah, adhkarMasa, {
    dispose: () => clearInterval(interval),
  });
};

module.exports = {
  registerCommands,
};
