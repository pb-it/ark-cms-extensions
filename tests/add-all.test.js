const path = require('path');
const fs = require('fs');

const assert = require('assert');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Add all', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        try {
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
            file = path.resolve(__dirname, "../dist/" + ext + ".zip");
            assert.equal(fs.existsSync(file), true, "File '" + file + "' not found!");
            await ec.addExtension(ext, file);
        }
        const ac = app.getApiController();
        await ac.processOpenRestartRequest();

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = await app.getWindow();
        var modal = await window.getTopModal();
        assert.equal(modal, null);

        //prevent race condition within express webserver, caused by calling listen() and then immediately calling close()
        //await ExtendedTestHelper.delay(10000); //ensure minimum uptime before next test might restart again 

        return Promise.resolve();
    });
});