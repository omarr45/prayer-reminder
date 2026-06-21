const vscode = require('vscode');
const { prayerOrder, prayerMessages } = require('./constants');
const { getDateKey, getDisplayPrayerName } = require('./utils');
const { ensureCache, loadTimingsFromCache, updateCountdowns, getCache } = require('./cache');
const { showAdhkarNotification } = require('./adhkar');

const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
item.tooltip = 'Next prayer';

let k,
  lastDay,
  isPrayerTime = false,
  updatePromise = null;

const getConfigureTooltip = (message) => {
  const tooltip = new vscode.MarkdownString(
    `${message}\n\n[Configure prayer times](command:prayerReminder.configure) | [Detect location](command:prayerReminder.detectLocation)`
  );
  tooltip.isTrusted = true;

  return tooltip;
};

const setLoadingText = () => {
  item.text = `$(watch) Updating prayer times`;
  item.tooltip = getConfigureTooltip('Updating prayer times.');
  item.backgroundColor = null;
};

const showFetchError = () => {
  vscode.window
    .showErrorMessage(
      'Prayer Reminder: Error fetching prayer times, please check your settings and then reload the window',
      'Open Settings'
    )
    .then((selection) => {
      if (selection === 'Open Settings')
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'prayerReminder'
        );
    });
};

const updateTooltip = (nextPrayerName, hours, minutes) => {
  const prayerCache = getCache();
  const todayKey = getDateKey(new Date());
  const todayTimings = prayerCache && prayerCache.days && prayerCache.days[todayKey];
  const tooltip = new vscode.MarkdownString();

  tooltip.appendMarkdown("**Today's Prayer Times**\n\n");

  if (todayTimings) {
    for (const prayer of prayerOrder) {
      if (todayTimings[prayer]) {
        tooltip.appendMarkdown(
          `- **${getDisplayPrayerName(prayer, todayKey)}**: ${todayTimings[prayer]}\n`
        );
      }
    }
  } else {
    tooltip.appendMarkdown('Prayer times are not loaded for today.\n');
  }

  if (nextPrayerName) {
    tooltip.appendMarkdown(`\nNext: **${nextPrayerName}** in ${hours}h ${minutes}m`);
  }

  const adhkarCommand =
    new Date().getHours() < 12
      ? 'prayerReminder.openAdhkarSabah'
      : 'prayerReminder.openAdhkarMasa';
  const adhkarLabel =
    new Date().getHours() < 12
      ? 'أذكار الصباح (Morning Adhkar)'
      : 'أذكار المساء (Evening Adhkar)';

  tooltip.appendMarkdown(
    `\n\n[${adhkarLabel}](command:${adhkarCommand}) \n\n[Configure prayer times](command:prayerReminder.configure) | [Detect location](command:prayerReminder.detectLocation)`
  );
  tooltip.isTrusted = true;

  item.tooltip = tooltip;
};

const updateMaps = async (forceRefresh = false) => {
  const { until, timings } = require('./cache');

  if (updatePromise) {
    if (!forceRefresh) return updatePromise;

    await updatePromise;
  }

  updatePromise = (async () => {
    until.clear();
    timings.clear();

    const date = new Date();
    lastDay = date.getDate();

    try {
      const cache = await ensureCache(forceRefresh);
      loadTimingsFromCache(cache, date);
      updateCountdowns(date);

      return true;
    } catch (error) {
      showFetchError();

      return false;
    } finally {
      updatePromise = null;
    }
  })();

  return updatePromise;
};

const updateText = async () => {
  const { until, timings } = require('./cache');

  // Check if the day has changed
  const date = new Date();
  const day = date.getDate();

  if (day !== lastDay || timings.size === 0) {
    await updateMaps();
  } else {
    updateCountdowns(date);
  }

  if (until.size === 0) {
    await updateMaps();
  }

  if (until.size === 0) {
    setLoadingText();
    return;
  }

  // get the next prayer's name
  k = until.keys().next().value;
  const nextPrayer = timings.get(k);
  const nextPrayerName = nextPrayer.displayName;

  // convert the time left to hours:minutes
  const timeLeft = until.get(k);
  const hours = Math.floor(timeLeft / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeft / 1000 / 60 / 60 - hours) * 60);

  // Showing popup on prayer time
  if (hours === 0 && minutes === 0) {
    if (!isPrayerTime) {
      // Store some state so this shows only once and then resets
      isPrayerTime = true;

      item.text = `$(watch) ${nextPrayerName} Adhan now`;
      updateTooltip(nextPrayerName, hours, minutes);

      const message = prayerMessages[nextPrayerName] || {
        text: `It's time for ${nextPrayerName} prayer`,
      };
      vscode.window.showInformationMessage(message.text);
      if (message.dua) {
        vscode.window.showInformationMessage(message.dua);
      }

      showAdhkarNotification(nextPrayerName);

      // We want to preserve the item text at least for this minute
      return;
    }
  } else {
    if (isPrayerTime) {
      // Reset after 1m of showing that it's prayer time
      isPrayerTime = false;
    }

    // set the text
    item.text = `$(watch) ${nextPrayerName} in ${hours}h ${minutes}m`;
    updateTooltip(nextPrayerName, hours, minutes);

    // Changing background color
    if (hours === 0 && minutes <= 10 && minutes > 5) {
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
    } else if (hours === 0 && minutes <= 5) {
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    } else {
      item.backgroundColor = null;
    }

    isPrayerTime = false;
  }
};

const showItem = () => item.show();
const disposeItem = () => item.dispose();

module.exports = {
  createStatusBarItem: () => item,
  showItem,
  disposeItem,
  setLoadingText,
  updateTooltip,
  updateMaps,
  updateText,
};
