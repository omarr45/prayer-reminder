const vscode = require('vscode');
const { methodByCountry } = require('./constants');

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.toLowerCase().slice(1);
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const getStartOfToday = () => {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parsePrayerDate = (dateKey, time) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute);
};

const isFriday = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day).getDay() === 5;
};

const getDisplayPrayerName = (prayer, dateKey) => {
  if (prayer === 'Dhuhr' && isFriday(dateKey)) {
    return "Jumu'ah";
  }

  return prayer;
};

const getSettings = () => {
  const config = vscode.workspace.getConfiguration('prayerReminder');

  return {
    city: config.get('city'),
    country: config.get('country'),
    method: config.get('method'),
  };
};

const hasConfiguredLocation = () => {
  const config = vscode.workspace.getConfiguration('prayerReminder');
  const city = config.inspect('city');
  const country = config.inspect('country');

  return Boolean(
    city.globalValue ||
      city.workspaceValue ||
      city.workspaceFolderValue ||
      country.globalValue ||
      country.workspaceValue ||
      country.workspaceFolderValue
  );
};

const getDetectedMethod = (country) => methodByCountry.get(country) || 3;

module.exports = {
  capitalize,
  getDateKey,
  addDays,
  getStartOfToday,
  parsePrayerDate,
  isFriday,
  getDisplayPrayerName,
  getSettings,
  hasConfiguredLocation,
  getDetectedMethod,
};
