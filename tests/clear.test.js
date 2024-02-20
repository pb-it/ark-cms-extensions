const fs = require('fs');
const path = require('path');

const assert = require('assert');
//const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

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

        await app.prepare(config['api'], config['username'], config['password']);

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

    it('#clear database', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ac = helper.getApiController();
        await app.resetLocalStorage();
        await ac.clearDatabase();

        await ac.restart(true);
        await app.reload();
        await TestHelper.delay(1000);
        await app.prepare(helper.getConfig()['api']);
        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#clear CDN', async function () {
        this.timeout(60000);

        if (config['cdn']) {
            for (const file of fs.readdirSync(config['cdn'])) {
                fs.unlinkSync(path.join(config['cdn'], file));
            }
        } else
            this.skip();

        return Promise.resolve();
    });
});