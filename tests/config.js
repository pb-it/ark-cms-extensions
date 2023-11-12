const host = 'http://localhost:4000';
//const host = 'http://localhost';

const firefox = {
    'host': host,
    'browser': 'firefox',
    'profile': '/home/user/snap/firefox/common/.mozilla/firefox/k03y4h3d.Selenium'
}

const chrome = {
    'host': host,
    'browser': 'chrome',
    'user-data-dir': '/home/user/snap/chromium/common/chromium',
    'profile-directory': 'Profile 1'
}

module.exports = chrome;