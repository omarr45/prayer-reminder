const vscode = require('vscode');
const axios = require('axios');
const {
  CACHE_KEY,
  CACHE_DAYS,
  REFRESH_THRESHOLD_DAYS,
  prayerOrder,
} = require('./constants');
const {
  capitalize,
  getSettings,
  getStartOfToday,
  getDateKey,
  addDays,
  parsePrayerDate,
  getDisplayPrayerName,
} = require('./utils');

let extensionContext;
let prayerCache;

const until = new Map();
const timings = new Map();

const initCache = (context) => {
  extensionContext = context;
  loadCacheFromState();
};

const getCalendar = async (date, settings) => {
  const { city, country, method } = settings;

  const month = date.getMonth() + 1,
    year = date.getFullYear();

  const url = `http://api.aladhan.com/v1/calendarByCity?city=${capitalize(
    city
  )}&country=${capitalize(
    country
  )}&method=${method}&month=${month}&year=${year}`;

  const res = await axios.get(url);

  return res.data.data;
};

const getPrayerTimings = (dayTimings) => {
  const prayers = {};

  for (const prayer of prayerOrder) {
    if (dayTimings[prayer]) {
      prayers[prayer] = dayTimings[prayer].substring(0, 5);
    }
  }

  return prayers;
};

const isCacheForSettings = (cache, settings) =>
  cache &&
  cache.city === settings.city &&
  cache.country === settings.country &&
  cache.method === settings.method &&
  cache.days;

const getFutureCachedDays = (cache, today = getStartOfToday()) => {
  if (!cache || !cache.days) return [];

  const todayKey = getDateKey(today);

  return Object.keys(cache.days)
    .filter((dateKey) => dateKey >= todayKey)
    .sort();
};

const hasUsableCache = (cache, settings) =>
  isCacheForSettings(cache, settings) && getFutureCachedDays(cache).length > 0;

const hasEnoughCache = (cache, settings) =>
  isCacheForSettings(cache, settings) &&
  getFutureCachedDays(cache).length >= REFRESH_THRESHOLD_DAYS;

const loadCacheFromState = () => {
  if (!extensionContext) return;

  prayerCache = extensionContext.globalState.get(CACHE_KEY);
};

const saveCache = async (cache) => {
  prayerCache = cache;

  if (extensionContext) {
    await extensionContext.globalState.update(CACHE_KEY, cache);
  }
};

const buildCache = async (settings, startDate = getStartOfToday()) => {
  const days = {};
  const calendars = new Map();
  const endDate = addDays(startDate, CACHE_DAYS - 1);

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (!calendars.has(monthKey)) {
      calendars.set(monthKey, await getCalendar(date, settings));
    }

    const calendar = calendars.get(monthKey);
    const day = calendar[date.getDate() - 1];

    if (day && day.timings) {
      days[getDateKey(date)] = getPrayerTimings(day.timings);
    }
  }

  return {
    city: settings.city,
    country: settings.country,
    method: settings.method,
    updatedAt: new Date().toISOString(),
    days,
  };
};

const ensureCache = async (forceRefresh = false) => {
  const settings = getSettings();
  loadCacheFromState();

  if (!forceRefresh && hasEnoughCache(prayerCache, settings)) {
    return prayerCache;
  }

  try {
    const cache = await buildCache(settings);
    await saveCache(cache);

    return cache;
  } catch (error) {
    if (hasUsableCache(prayerCache, settings)) {
      vscode.window.showWarningMessage(
        'Prayer Reminder: Using saved prayer times because the latest times could not be fetched.'
      );

      return prayerCache;
    }

    throw error;
  }
};

const loadTimingsFromCache = (cache, now = new Date()) => {
  timings.clear();

  if (!cache || !cache.days) return;

  for (const dateKey of getFutureCachedDays(cache)) {
    const dayTimings = cache.days[dateKey];

    for (const prayer of prayerOrder) {
      if (!dayTimings[prayer]) continue;

      const prayerTime = parsePrayerDate(dateKey, dayTimings[prayer]);

      if (prayerTime > now) {
        timings.set(`${dateKey}:${prayer}`, {
          name: prayer,
          displayName: getDisplayPrayerName(prayer, dateKey),
          dateKey,
          time: dayTimings[prayer],
          date: prayerTime,
        });
      }
    }
  }
};

const updateCountdowns = (now = new Date()) => {
  until.clear();

  for (const [key, prayer] of timings) {
    const timeLeft = prayer.date - now;

    if (timeLeft > 0) {
      until.set(key, timeLeft);
    } else {
      timings.delete(key);
    }
  }
};

const getCache = () => prayerCache;

module.exports = {
  until,
  timings,
  initCache,
  ensureCache,
  loadTimingsFromCache,
  updateCountdowns,
  getCache,
};
