const path = require('path');

const assert = require('assert');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - HttpProxy', function () {

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

        const window = app.getWindow();
        const modal = await window.getTopModal();
        assert.equal(modal, null);

        const tools = await app.getApiController().getTools();
        const client = 'fetch';
        const cmd = `async function test() {
    const registry = controller.getRegistry();
    await registry.upsert('defaultWebClient', '${client}');
    controller.getWebClientController().setDefaultWebClient('${client}');
    return Promise.resolve('OK');
};
module.exports = test;`
        const res = await tools.serverEval(cmd);
        assert.equal(res, 'OK', "Setting WebClient Failed!");

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
        this.timeout(120000);

        const ext = 'http-proxy';
        const file = path.resolve(__dirname, "../dist/" + ext + ".zip");

        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);
        //await ExtendedTestHelper.delay(2000); //TODO: why does this extension need such a long delay?
        //const ac = app.getApiController();
        //await ac.processOpenRestartRequest();

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test forward request', async function () {
        this.timeout(30000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.google.at';
            const res = await HttpProxy.request(url);
            callback(res);
        });
        assert.equal(response.startsWith('<!doctype html>'), true);

        var error = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            var res;
            try {
                res = await HttpProxy.request(url);
            } catch (error) {
                res = error;
            }
            callback(res);
        });
        assert.equal(error['response']['status'], 403);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            const options = {
                'headers': {
                    'Host': 'www.finanzen.at',
                    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0'
                }
            };
            const res = await HttpProxy.request(url, options);
            callback(res);
        });
        assert.equal(response.startsWith('\r\n<!DOCTYPE html>'), true);

        return Promise.resolve();
    });

    xit('#test forward formdata', async function () {
        this.timeout(10000);

        //TODO:

        return Promise.resolve();
    });
});