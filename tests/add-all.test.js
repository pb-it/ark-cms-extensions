const path = require('path');
const fs = require('fs');

const assert = require('assert');

const config = require('./config/test-config.js');
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
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.login(config['api'], config['username'], config['password']);

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
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

    it('#test add extensions', async function () {
        this.timeout(300000);

        const extensions = ['mime-text', 'process', 'formatter', 'http-proxy', 'axios-webclient', 'scraper', 'console', 'chat'];
        const ec = helper.getExtensionController();
        var file;
        for (var ext of extensions) {
            file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
            assert.equal(fs.existsSync(file), true, "File '" + file + "' not found!");
            await ec.addExtension(ext, file);
        }
        const ac = helper.getApiController();
        await ac.checkRestartRequest();

        const app = helper.getApp();
        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});