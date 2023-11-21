const config = {
    host: 'http://localhost:4000',
    //api: 'https://localhost:3002',
    browser: {
        //name: 'firefox'
        name: 'chrome'
        //snap: true
    }
};

if (config['browser']['name'] === 'firefox') {
    if (process.platform === 'win32')
        config['browser']['binary'] = os.homedir() + '/AppData/Local/Mozilla Firefox/firefox.exe';
    else {
        if (config['browser']['snap']) {
            config['browser']['binary'] = '/snap/firefox/current/usr/lib/firefox/geckodriver';
            config['browser']['profile'] = '/home/user/snap/firefox/common/.mozilla/firefox/unu040qh.Selenium';
        } else
            config['browser']['profile'] = '/home/user/.mozilla/firefox/30pux3b4.Selenium';
    }
} else if (config['browser']['name'] === 'chrome') {
    config['browser']['profile-directory'] = 'Profile 1';
    if (process.platform === 'win32')
        config['browser']['user-data-dir'] = 'C:/Users/user/AppData/Local/Google/Chrome/User Data';
    else
        config['browser']['user-data-dir'] = '/home/user/snap/chromium/common/chromium';
}

module.exports = config;