const CACHE_KEY = 'prayerReminder.cache.v1';
const LOCATION_DETECTED_KEY = 'prayerReminder.locationDetected.v1';
const CACHE_DAYS = 30;
const REFRESH_THRESHOLD_DAYS = 14;

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const calculationMethods = [
  { id: 0, name: 'Shia Ithna-Ashari, Leva Institute, Qum' },
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 3, name: 'Muslim World League' },
  { id: 4, name: 'Umm Al-Qura University, Makkah' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore' },
  { id: 12, name: 'Union Organization Islamic de France' },
  { id: 13, name: 'Diyanet Isleri Baskanligi, Turkey' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
  { id: 15, name: 'Moonsighting Committee Worldwide' },
  { id: 16, name: 'Dubai' },
  { id: 17, name: 'Jabatan Kemajuan Islam Malaysia (JAKIM)' },
  { id: 18, name: 'Tunisia' },
  { id: 19, name: 'Algeria' },
  { id: 20, name: 'Kementerian Agama Republik Indonesia' },
  { id: 21, name: 'Morocco' },
  { id: 22, name: 'Comunidade Islamica de Lisboa' },
  {
    id: 23,
    name: 'Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan',
  },
];

const methodByCountry = new Map([
  ['Algeria', 19],
  ['Canada', 2],
  ['Egypt', 5],
  ['France', 12],
  ['Indonesia', 20],
  ['Jordan', 23],
  ['Kuwait', 9],
  ['Malaysia', 17],
  ['Morocco', 21],
  ['Qatar', 10],
  ['Russia', 14],
  ['Saudi Arabia', 4],
  ['Singapore', 11],
  ['Tunisia', 18],
  ['Turkey', 13],
  ['United Arab Emirates', 16],
  ['United States', 2],
]);

const prayerMessages = {
  Fajr: {
    text: "It's time for Fajr prayer — the dawn prayer",
    dua: 'رَكْعَتا الفَجْرِ خيرٌ منَ الدُّنيا وما فيها',
  },
  Dhuhr: {
    text: "It's time for Dhuhr prayer — the midday prayer",
    dua: 'إِنَّ الصَّلاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
  },
  Asr: {
    text: "It's time for Asr prayer — the afternoon prayer",
    dua: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلاةِ الْوُسْطَى',
  },
  Maghrib: {
    text: "It's time for Maghrib prayer — the sunset prayer",
    dua: 'وَأَقِمِ الصَّلاةَ لِذِكْرِي',
  },
  Isha: {
    text: "It's time for Isha prayer — the night prayer",
    dua: 'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَكَ عَسَى أَنْ يَبْعَثَكَ رَبُّكَ مَقَامًا مَحْمُودًا',
  },
};

module.exports = {
  CACHE_KEY,
  LOCATION_DETECTED_KEY,
  CACHE_DAYS,
  REFRESH_THRESHOLD_DAYS,
  prayerOrder,
  calculationMethods,
  methodByCountry,
  prayerMessages,
};
