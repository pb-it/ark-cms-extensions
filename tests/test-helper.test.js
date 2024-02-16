const path = require('path');
const https = require('https');
//const fetch = require('node-fetch');
const fetch = require('cross-fetch');
const semver = require('semver');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Test Helper', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        https.globalAgent.options.rejectUnauthorized = false;

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.resetLocalStorage();
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

    it('#test add extension', async function () {
        this.timeout(30000);

        const ext = 'test-helper';
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        await helper.getExtensionController().addExtension(ext, file, true);

        const app = helper.getApp();
        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test echo', async function () {
        this.timeout(60000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const controller = app.getController();
            const ac = controller.getApiController();
            const client = ac.getApiClient();
            const res = await client.request('GET', '/api/ext/test-helper/echo?message=hello world');
            callback(res);
        });
        assert.equal(response, 'hello world');

        return Promise.resolve();
    });

    it('#test sleep', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const api = await app.getApiUrl();
        const url = api + '/api/ext/test-helper/sleep?seconds=5';

        const timeout = 3000;
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), timeout);
        var err;
        var response;
        const start = Date.now();
        try {
            response = await fetch(url, { signal: ac.signal });
        } catch (error) {
            err = error;
        } finally {
            clearTimeout(to);
            const duration = (Date.now() - start) / 1000;
            console.log(duration);
        }
        assert.equal(err.name, 'AbortError');

        //console.time('timer1');
        response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        //console.timeEnd('timer1');
        assert.equal(await response.text(), 'done');

        return Promise.resolve();
    });

    xit('#test cluster', async function () {
        this.timeout(60000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const controller = app.getController();
            const ac = controller.getApiController();
            const info = await ac.fetchApiInfo();
            callback(info['version']);
        });
        if (semver.valid(response) && semver.gt(response, '0.6.2')) {
            const app = helper.getApp();
            const api = await app.getApiUrl();
            var url = api + '/api/ext/test-helper/sleep?seconds=5&blocking=true&_batch=true';
            var response = await fetch(url, { signal: AbortSignal.timeout(2000) });
            var batch = await response.json();
            //console.log(batch);
            assert.equal(batch['state'], 'running');

            await TestHelper.delay(100);

            url = api + '/api/ext/test-helper/echo?message=hello world';
            var err;
            try {
                var response = await fetch(url, { signal: AbortSignal.timeout(2000) });
            } catch (error) {
                err = error;
            }
            console.log(err);
            assert.equal(err, undefined);
            assert.equal(response, 'hello world');
        } else
            this.skip();
        return Promise.resolve();
    });
});