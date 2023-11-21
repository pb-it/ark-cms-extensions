const path = require('path');

const assert = require('assert');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - HttpProxy', function () {

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

        const tools = await helper.getApiController().getTools();
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
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        await helper.getExtensionController().addExtension(ext, file, true);
        //await TestHelper.delay(2000); //TODO: why does this extension need such a long delay?
        //const ac = helper.getApiController();
        //await ac.processOpenRestartRequest();

        const app = helper.getApp();
        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
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