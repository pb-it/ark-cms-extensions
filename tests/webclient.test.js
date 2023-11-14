const path = require('path');

const assert = require('assert');

const config = require('./config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - WebClient', function () {

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

    it('#test add extension', async function () {
        this.timeout(120000);

        const ext = 'axios-webclient';
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        await helper.getExtensionController().addExtension(ext, file, true);

        await helper.reload();

        await TestHelper.delay(1000);

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test request', async function () {
        this.timeout(30000);

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

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            const options = {
                'client': 'axios'
            };
            const res = await HttpProxy.request(url, options);
            callback(res);
        });
        assert.equal(response.startsWith('\r\n<!DOCTYPE html>'), true);

        error = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.at/akten/nvidia-aktie'; // AKTEN
            const options = {
                'client': 'axios'
            };
            var res;
            try {
                res = await HttpProxy.request(url, options);
            } catch (error) {
                res = error;
            }
            callback(res);
        });
        assert.equal(error['response']['status'], 404);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const data = {
                'cmd': `async function test() {
    controller.getWebClientController().setDefaultWebClient('axios');
    return Promise.resolve('OK');
};
                
module.exports = test;`};

            const ac = app.getController().getApiController();
            const client = ac.getApiClient();
            var tmp = await client.request('POST', '/sys/tools/dev/eval?_format=text', data);
            if (tmp !== 'OK')
                throw new Error('Switching WebClient Failed');

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            const res = await HttpProxy.request(url);
            callback(res);
        });
        assert.equal(response.startsWith('\r\n<!DOCTYPE html>'), true);

        return Promise.resolve();
    });
});