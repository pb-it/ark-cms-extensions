const path = require('path');
const fs = require('fs');

const assert = require('assert');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Add all', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        try {
            if (!global.helper) {
                global.helper = new TestHelper();
                await helper.setup(config);
            }
            driver = helper.getBrowser().getDriver();
            const app = helper.getApp();

            await TestHelper.delay(1000);

            await app.prepare(config['api'], config['username'], config['password']);

            await TestHelper.delay(1000);

            const modal = await app.getWindow().getTopModal();
            assert.equal(modal, null);
        } catch (error) {
            global.allPassed = false;
            throw error;
        }

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
        const app = helper.getApp();
        const ec = app.getExtensionController();
        var file;
        for (var ext of extensions) {
            file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
            assert.equal(fs.existsSync(file), true, "File '" + file + "' not found!");
            await ec.addExtension(ext, file);
        }
        const ac = app.getApiController();
        await ac.processOpenRestartRequest();

        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const window = await app.getWindow();
        var modal = await window.getTopModal();
        assert.equal(modal, null);

        //prevent race condition within express webserver, caused by calling listen() and then immediately calling close()
        //await TestHelper.delay(10000); //ensure minimum uptime before next test might restart again 

        return Promise.resolve();
    });
});