const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe("Root Suite", function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();

        global.allPassed = true;

        return Promise.resolve();
    });

    after('#teardown', async function () {
        if (allPassed)
            await driver.quit();
        return Promise.resolve();
    });

    //require('./clear.test.js');
    require('./add-all.test.js');
    require('./http-proxy.test.js');
    require('./webclient.test.js');
    require('./scraper.test.js');
    require('./youtube.test.js');
    require('./file2.test.js');
});