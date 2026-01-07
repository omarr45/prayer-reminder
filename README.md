# 🕌 Prayer Reminder

![Screenshot-01](https://i.imgur.com/uvnkdlf.png)

Prayer Times is an extension aimed to help you remember your prayers by showing you the remaining time till the upcoming prayer in the status bar

![Screenshot-02](https://i.imgur.com/gsQ8laA.png)

## Installation

### Using VS Code UI

1. Download the latest `prayer-reminder-<version>.vsix` from the Releases page.
2. In VS Code, open the Command Palette (`Ctrl` + `Shift` + `P` on Windows/Linux, `Cmd` + `Shift` + `P` on macOS).
3. Run **Extensions: Install from VSIX...** and select the downloaded file.

### Using the CLI

```bash
code --install-extension path/to/prayer-reminder-<version>.vsix
```

## Extension Settings

- `prayerReminder.city`: Enter the city name 'eg. Cairo'.
- `prayerReminder.country`: Enter the country name 'eg. Egypt'.
- `prayerReminder.method`: Method of calculating prayer times, more info [here](https://aladhan.com/calculation-methods).
- `prayerReminder.refreshIntervalMinutes`: Minutes between automatic refreshes (default 5 minutes).
- `prayerReminder.alertMinutes`: Minutes before the next prayer to show a notification (default is 20; set to 0 to disable the pre-prayer alert).

<!-- ## Release Notes

Users appreciate release notes as you update your extension. -->

## 1.0.0

- Initial release

## 1.0.1

- Fixed after-Isha issue.
- Added `Refresh` function to force refresh timings

## 1.0.2

- Fixed end-of-day NaN issue.

## 1.0.3

- Fixed wrong timings after prayers.

## 1.0.4

- Introduced stability fixes.
- Added configurable pre-prayer notifications.

## 1.0.5

- Added release automation workflow for packaging and publishing VSIX.
- Documented configurable pre-prayer notifications and licensing.

## 1.0.6

- Added configurable auto-refresh interval (default 5 minutes) for prayer time updates.
- After the final prayer of the day, the status now counts down to the next day's Fajr.
- Improved reliability with HTTPS API calls and clearer error logging.
- Color warnings now start at 20 minutes before prayer, with minute-by-minute alerts in the final 10 minutes.

## Developed by

[Omar AbdulRahman](https://omar45.com/) & [Mohamed Eldeeb](https://github.com/mosamadeeb)

## For any bugs or issues, please contact me at contact@omar45.com
