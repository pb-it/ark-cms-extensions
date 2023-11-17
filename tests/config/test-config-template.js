const host = 'http://localhost:4000';

const firefox = {
    'name': 'firefox',
    'profile': '/home/user/snap/firefox/common/.mozilla/firefox/k03y4h3d.Selenium'
}

const chrome = {
    'name': 'chrome',
    'profile-directory': 'Profile 1'
}
if (process.platform === 'win32')
    chrome['user-data-dir'] = 'C:/Users/user/AppData/Local/Google/Chrome/User Data';
else
    chrome['user-data-dir'] = '/home/user/snap/chromium/common/chromium';

module.exports = {
    host: host,
    browser: chrome
}