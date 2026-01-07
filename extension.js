const vscode = require('vscode');
const axios = require('axios');

const IGNORE_KEYS = new Set([
  'Imsak',
  'Midnight',
  'Sunrise',
  'Sunset',
  'Firstthird',
  'Lastthird',
]);

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.toLowerCase().slice(1);
};

const until = new Map(),
  timings = new Map();

const alertedBefore = new Set();
const minuteAlerts = new Map();
let baseRefreshIntervalMs = 300000;
let refreshIntervalMs = 300000;
let refreshTimer;
const output = vscode.window.createOutputChannel('Prayer Reminder');

const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
item.tooltip = 'Next prayer';
item.text = `\$(watch) Loading prayer times...`;

let k,
  lastDay,
  isPrayerTime = false,
  endOfDay = false;

const getExtensionConfig = () => {
  const config = vscode.workspace.getConfiguration('prayerReminder');
  return {
    city: config.get('city'),
    country: config.get('country'),
    method: config.get('method'),
    alertMinutes: config.get('alertMinutes', 20),
    refreshIntervalMinutes: config.get('refreshIntervalMinutes', 5),
  };
};

const fetchTimingsByDate = async (date, city, country, method) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const url = `https://api.aladhan.com/v1/timingsByCity?city=${capitalize(
    city
  )}&country=${capitalize(country)}&method=${method}&date=${day}-${month}-${year}`;

  const response = await axios.get(url);
  return response.data.data.timings;
};

const normalizeTimings = (rawTimings) =>
  Object.entries(rawTimings || {})
    .filter(([key]) => !IGNORE_KEYS.has(key))
    .map(([key, value]) => ({
      name: key,
      time: value.substring(0, 5),
    }))
    .sort(
      (a, b) =>
        a.time.split(':').map(Number)[0] * 60 +
        Number(a.time.split(':')[1]) -
        (b.time.split(':').map(Number)[0] * 60 + Number(b.time.split(':')[1]))
    );

const showFetchError = () => {
  output.appendLine('Prayer Reminder: Failed to fetch prayer times.');
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

const setEndOfDayText = () => {
  item.text = `\$(watch) No prayers left today`;
  item.backgroundColor = null;
};

const addUpcomingTimings = (prayers, baseDate) => {
  for (const { name, time } of prayers) {
    const [hour, minute] = time.split(':').map(Number);
    const prayerTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      minute
    );
    const timeLeft = prayerTime - baseDate;

    if (timeLeft > 0) {
      timings.set(name, time);
      until.set(name, timeLeft);
    }
  }
};

const updateMaps = async () => {
  until.clear();
  timings.clear();
  minuteAlerts.clear();

  const { city, country, method, refreshIntervalMinutes } = getExtensionConfig();
  baseRefreshIntervalMs = Math.max(1, Number(refreshIntervalMinutes) || 5) * 60000;
  refreshIntervalMs = baseRefreshIntervalMs;
  output.appendLine(
    `Prayer Reminder: Refreshing timings for ${city}, ${country} using method ${method}.`
  );

  const date = new Date();
  const day = date.getDate();
  const isNewDay = lastDay !== day;

  lastDay = day;

  if (isNewDay) {
    alertedBefore.clear();
    isPrayerTime = false;
  }

  let todayTimings;
  try {
    todayTimings = normalizeTimings(
      await fetchTimingsByDate(date, city, country, method)
    );
  } catch (error) {
    output.appendLine(`Prayer Reminder: Fetch failed - ${error.message}`);
    showFetchError();
    endOfDay = true;
    setEndOfDayText();
    return;
  }

  addUpcomingTimings(todayTimings, date);

  if (until.size === 0) {
    try {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      const nextTimings = normalizeTimings(
        await fetchTimingsByDate(nextDate, city, country, method)
      );
      const fajr = nextTimings.find(({ name }) => name === 'Fajr');

      if (fajr) {
        const [hour, minute] = fajr.time.split(':').map(Number);
        const prayerTime = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          nextDate.getDate(),
          hour,
          minute
        );
        const timeLeft = prayerTime - date;
        if (timeLeft > 0) {
          timings.set('Fajr', fajr.time);
          until.set('Fajr', timeLeft);
          endOfDay = false;
        } else {
          endOfDay = true;
          setEndOfDayText();
        }
      } else {
        endOfDay = true;
        setEndOfDayText();
      }
    } catch (error) {
      output.appendLine(`Prayer Reminder: Next-day fetch failed - ${error.message}`);
      showFetchError();
      endOfDay = true;
      setEndOfDayText();
    }
  }
};

const updateText = () => {
  if (endOfDay || until.size === 0) {
    setEndOfDayText();
    return;
  }

  // Check if the day has changed
  const date = new Date();
  const day = date.getDate();

  if (day !== lastDay) {
    updateMaps().then(() => updateText());
    return;
  }

  // get the next prayer's name
  k = until.keys().next().value;

  const timeLeftMs = until.get(k);
  const alertMinutes = getExtensionConfig().alertMinutes;
  const alertThresholdMs = alertMinutes * 60000;

  // convert the time left to hours:minutes
  const hours = Math.floor(timeLeftMs / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeftMs / 1000 / 60 / 60 - hours) * 60);
  const roundedMinutes = Math.max(0, Math.round(timeLeftMs / 60000));

  const targetInterval =
    roundedMinutes <= 10
      ? Math.min(60000, baseRefreshIntervalMs)
      : baseRefreshIntervalMs;
  if (targetInterval !== refreshIntervalMs) {
    refreshIntervalMs = targetInterval;
    restartRefreshTimer();
  }

  if (
    alertMinutes > 0 &&
    alertThresholdMs > 0 &&
    !alertedBefore.has(k) &&
    timeLeftMs > 60000 &&
    timeLeftMs <= alertThresholdMs
  ) {
    alertedBefore.add(k);
    vscode.window.showInformationMessage(
      `${roundedMinutes} minutes left for ${k} prayer`
    );
  }

  if (roundedMinutes > 0 && roundedMinutes <= 10) {
    const lastMinuteAlert = minuteAlerts.get(k);
    if (lastMinuteAlert !== roundedMinutes) {
      minuteAlerts.set(k, roundedMinutes);
      vscode.window.showInformationMessage(
        `${roundedMinutes} minutes left for ${k} prayer`
      );
      output.appendLine(`Prayer Reminder: ${roundedMinutes} minutes left for ${k}.`);
    }
  }

  // Showing popup on prayer time
  if (hours === 0 && minutes === 0) {
    minuteAlerts.delete(k);
    if (!isPrayerTime) {
      // Store some state so this shows only once and then resets
      isPrayerTime = true;

      item.text = `\$(watch) ${k} Adhan now`;
      vscode.window.showInformationMessage(`It's time for ${k} prayer`);
      if (k === 'Asr')
        vscode.window.showInformationMessage(
          `حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلاةِ الْوُسْطَى`
        );
      if (k === 'Fajr')
        vscode.window.showInformationMessage(
          `رَكْعَتا الفَجْرِ خيرٌ منَ الدُّنيا وما فيها`
        );

      // We want to preserve the item text at least for this minute
      return;
    }
  } else {
    if (isPrayerTime) {
      // Reset after 1m of showing that it's prayer time
      isPrayerTime = false;
    }

    // set the text
    item.text = `\$(watch) ${k} in ${hours}h ${minutes}m`;

    // Changing background color
    if (hours === 0 && minutes <= 20 && minutes > 10) {
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
    } else if (hours === 0 && minutes <= 10) {
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    } else {
      item.backgroundColor = null;
    }

    if (until.size === 0) {
      setEndOfDayText();
    }
  }
};

const refreshTick = async () => {
  if (endOfDay) {
    setEndOfDayText();

    const date = new Date();
    const day = date.getDate();

    if (day !== lastDay) {
      endOfDay = false;
      await updateMaps();
      updateText();
      restartRefreshTimer();
    }
    return;
  }

  if (!k || !until.has(k)) {
    await updateMaps();
    updateText();
    restartRefreshTimer();
    return;
  }

  if (until.get(k) - refreshIntervalMs < 0) {
    until.delete(k);
    minuteAlerts.delete(k);
    if (until.size === 0) endOfDay = true;
  } else {
    until.set(k, until.get(k) - refreshIntervalMs);
  }

  updateText();
};

const restartRefreshTimer = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    refreshTick();
  }, refreshIntervalMs);
};

async function activate(context) {
  await updateMaps();
  updateText();

  item.show();

  restartRefreshTimer();

  const refresh = vscode.commands.registerCommand(
    'prayerReminder.refresh',
    () => {
      updateMaps()
        .then(() => {
          updateText();
          restartRefreshTimer();
        })
        .then(() => {
          vscode.window.showInformationMessage('Prayer Reminder: Refreshed');
        });
    }
  );

  context.subscriptions.push(refresh);
}

function deactivate() {
  vscode.window.showInformationMessage('لا خير في عملٍ يلهي عن الصلاة');
  vscode.window.showInformationMessage('Prayer Reminder: Deactivated');
  item.dispose();
  if (refreshTimer) clearInterval(refreshTimer);
}

module.exports = {
  activate,
  deactivate,
};
