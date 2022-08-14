const vscode = require('vscode');
const axios = require('axios');

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.toLowerCase().slice(1);
};

const until = new Map();
const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
item.tooltip = 'Next prayer';

let k;

const updateParams = () => {
  // get the next prayer's name
  k = until.keys().next().value;

  // convert the time left to hours:minutes
  const hours = Math.floor(until.get(k) / 1000 / 60 / 60);
  const minutes = Math.floor((until.get(k) / 1000 / 60 / 60 - hours) * 60);

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

  // Showing popup on prayer time
  if (hours === 0 && minutes === 0) {
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
  }

  // if (until.size === 0) {
  //   until.set('Fajr', res.data.data[day].timings.Fajr);
  //   k = until.keys().next().value;
  //   item.text = `\$(watch) No prayer today`;
  // }
};

async function activate(context) {
  const config = vscode.workspace.getConfiguration('prayerReminder');
  const city = config.get('city');
  const country = config.get('country');
  const method = config.get('method');

  const date = new Date();
  const day = date.getDate(),
    month = date.getMonth() + 1,
    year = date.getFullYear();

  const url = `http://api.aladhan.com/v1/calendarByCity?city=${capitalize(
    city
  )}&country=${capitalize(
    country
  )}&method=${method}&month=${month}&year=${year}`;

  let res = null;

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

  // create a new map for the timings
  const timings = new Map();

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
    // if (key == 'Dhuhr') (hour = 8), (minute = 25);

    const prayerTime = new Date(year, month - 1, day, hour, minute);
    const timeLeft = prayerTime - date;
    if (timeLeft > 0) {
      until.set(key, timeLeft);
    }
  }

  updateParams();

  item.show();

  // update the status bar item every minute
  setInterval(() => {
    // remove the first item from the map if the time left is less than 0
    if (until.get(k) - 60000 < 0) {
      until.delete(k);
    }
    // update the time left until the next prayer
    else until.set(k, until.get(k) - 60000);

    updateParams();
  }, 60000);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
