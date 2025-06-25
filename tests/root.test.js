const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe("Root Suite", function () {

    let bSetup;
    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
            bSetup = true;
        }
        driver = helper.getBrowser().getDriver();

        global.allPassed = true;

        return Promise.resolve();
    });

    after('#teardown', async function () {
        this.timeout(15000);

        if (allPassed) {
            if (bSetup)
                await helper.teardown();
            /*else
                await driver.quit();*/
        }

        return Promise.resolve();
    });

    require('./clear.test.js');
    require('./common.test.js');
    require('./add-all.test.js');
    require('./test-helper.test.js');
    require('./process.test.js');
    require('./mime-text.test.js');
    require('./http-proxy.test.js');
    require('./webclient.test.js');
    require('./scraper.test.js');
    require('./dlh.test.js');
    require('./youtube.test.js');
    require('./string2.test.js');
    require('./relation2.test.js');
    require('./file2.test.js');
    require('./dashboard.test.js');
    require('./scrum.test.js');
    require('./stocks.test.js');
    require('./gallery.test.js');
    require('./backup.test.js');
    require('./calendar.test.js');
    require('./snippets.test.js');
});