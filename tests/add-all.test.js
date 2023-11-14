const path = require('path');

const assert = require('assert');

const config = require('./config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Add all', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();

        await TestHelper.delay(1000);

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#test add extensions', async function () {
        this.timeout(300000);

        const extensions = ['mime-text', 'process', 'formatter', 'http-proxy', 'axios-webclient', 'scraper', 'console', 'chat'];
        const ec = helper.getExtensionController();
        var file;
        for (var ext of extensions) {
            file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
            await ec.addExtension(ext, file);
        }
        await helper.checkRestartRequest();

        await helper.reload();

        await TestHelper.delay(1000);

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});