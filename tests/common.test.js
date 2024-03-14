const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - common', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();
        await ExtendedTestHelper.delay(1000);

        await app.prepare(config['api'], config['username'], config['password']);
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    xit('#delete extension', async function () {
        this.timeout(60000);

        const ext = 'echo';

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Extensions');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('echo');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Delete extension \'' + ext + '\'?');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent());
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Deleted extension successfully!\nAPI server application needs to be restarted for the changes to take effect!'); //'Reload website for the changes to take effect!'
        await alert.accept();

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#install extension', async function () {
        this.timeout(60000);

        const ext = 'echo';
        const file = path.resolve(__dirname, "../dist/" + ext + ".zip");
        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const controller = app.getController();
            const ac = controller.getApiController();
            const client = ac.getApiClient();
            const res = await client.request('POST', '/api/ext/echo', null, 'hello world');
            callback(res);
        });
        assert.equal(response, 'hello world');

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});