const vscode = require('vscode');
const axios = require('axios');

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.toLowerCase().slice(1);
};

const until = new Map(),
  timings = new Map();

const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
item.tooltip = 'Next prayer';

let k,
  lastDay,
  res,
  isPrayerTime = false,
  endOfDay = false;

const setEndOfDayText = () => {
  item.text = `\$(watch) No prayers left today`;
  item.backgroundColor = null;
}

const updateMaps = async () => {
  until.clear();
  timings.clear();

  const config = vscode.workspace.getConfiguration('prayerReminder');
  const city = config.get('city');
  const country = config.get('country');
  const method = config.get('method');

  const date = new Date();
  const day = date.getDate(),
    month = date.getMonth() + 1,
    year = date.getFullYear();

  lastDay = day;

  const url = `http://api.aladhan.com/v1/calendarByCity?city=${capitalize(
    city
  )}&country=${capitalize(
    country
  )}&method=${method}&month=${month}&year=${year}`;

  try {
    res = await axios.get(url);
  } catch (error) {
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
  }

  const ignore = [
    'Imsak',
    'Midnight',
    'Sunrise',
    'Sunset',
    'Firstthird',
    'Lastthird',
  ];

  // loop over the timings and add them to the map
  for (const [key, value] of Object.entries(res.data.data[day - 1].timings)) {
    if (ignore.includes(key)) continue;
    timings.set(key, value.substring(0, 5));
  }

  // loop over the timings map and calculate the time left until the next prayer
  for (const [key, value] of timings) {
    let [hour, minute] = value.split(':');

    // ! REMOVE THIS
    // if (key == 'Isha') (hour = 19), (minute = 56);

    const prayerTime = new Date(year, month - 1, day, hour, minute);
    const timeLeft = prayerTime - date;
    if (timeLeft > 0) {
      until.set(key, timeLeft);
    }
  }

  if (until.size === 0) {
    endOfDay = true;
    setEndOfDayText();
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

  // convert the time left to hours:minutes
  const hours = Math.floor(until.get(k) / 1000 / 60 / 60);
  const minutes = Math.floor((until.get(k) / 1000 / 60 / 60 - hours) * 60);

  // Showing popup on prayer time
  if (hours === 0 && minutes === 0) {
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
  }
  else {
    if (isPrayerTime) {
      // Reset after 1m of showing that it's prayer time
      isPrayerTime = false;
    }

    // set the text
    item.text = `\$(watch) ${k} in ${hours}h ${minutes}m`;

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

    if (until.size === 0) {
      setEndOfDayText();
    }
  }
};

async function activate(context) {
  updateMaps().then(() => {
    updateText();
  });

  item.show();

  // update the status bar item every minute
  setInterval(() => {
    if (endOfDay) {
      setEndOfDayText();

      const date = new Date();
      const day = date.getDate();

      if (day !== lastDay) {
        endOfDay = false;
        updateMaps().then(() => updateText());
      }
    } else {
      if (until.get(k) - 60000 < 0) {
        // remove the first item from the map if the time left is less than 0
        until.delete(k);
        if (until.size === 0) endOfDay = true;
      }
      // update the time left until the next prayer
      else until.set(k, until.get(k) - 60000);

      updateText();
    }
  }, 60000);

  const refresh = vscode.commands.registerCommand(
    'prayerReminder.refresh',
    () => {
      updateMaps()
        .then(() => updateText())
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
}

module.exports = {
  activate,
  deactivate,
};
