const os = require('os');
const { Builder, Capabilities } = require('selenium-webdriver');

class TestSetup {

    _config;
    _bSetupDone = false;
    _driver;

    constructor(config) {
        if (TestSetup._instance)
            return TestSetup._instance
        TestSetup._instance = this;
        this._config = config;
    }

    async getDriver(browser) {
        if (!this._bSetupDone) {
            if (!browser)
                browser = this._config['browser'];
            switch (browser) {
                case 'firefox':
                    //driver = new Builder().withCapabilities(Capabilities.firefox()).build();

                    const firefox = require('selenium-webdriver/firefox');
                    var options = new firefox.Options();
                    //options.setBinary(os.homedir() + '/AppData/Local/Mozilla Firefox/firefox.exe');
                    options.setBinary('/usr/lib/firefox/firefox'); // '/snap/firefox'
                    if (this._config['profile'])
                        options.setProfile(this._config['profile']);
                    this._driver = await new Builder()
                        .forBrowser('firefox')
                        .setFirefoxOptions(options)
                        .build();

                    break;
                case 'chrome':
                default:
                    //this._driver = await new Builder().withCapabilities(Capabilities.chrome()).build();
                    var chrome = require("selenium-webdriver/chrome");
                    var options = new chrome.Options();
                    if (this._config['user-data-dir'])
                        options.addArguments('user-data-dir=' + this._config['user-data-dir']);
                    if (this._config['profile-directory'])
                        options.addArguments('profile-directory=' + this._config['profile-directory']);
                    this._driver = await new Builder()
                        .forBrowser('chrome')
                        .setChromeOptions(options)
                        .build();
            }
            const TIMEOUT = 300000000;
            await this._driver.manage().setTimeouts({
                //implicit: TIMEOUT,
                //pageLoad: TIMEOUT,
                script: TIMEOUT
            })

            this._driver.manage().window().maximize();
            this._driver.get(this._config['host']);

            this._bSetupDone = true;
        }
        return Promise.resolve(this._driver);
    }
}

module.exports = TestSetup;