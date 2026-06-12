const path = require('path');
const fs = require('fs');

const assert = require('assert');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - WebClient', function () {

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

        const ext = 'axios-webclient';
        const file = path.resolve(__dirname, "../dist/" + ext + ".zip");

        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test request', async function () {
        this.timeout(60000);

        /*var error = await driver.executeAsyncScript(async () => {
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
        assert.equal(error['response']['status'], 403);*/

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
            var tmp = await client.request('POST', '/sys/tools/dev/eval?_format=text', null, data);
            if (tmp !== 'OK')
                throw new Error('Switching WebClient Failed');

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            const res = await HttpProxy.request(url);
            callback(res);
        });
        assert.equal(response.startsWith('\r\n<!DOCTYPE html>'), true);

        return Promise.resolve();
    });

    it('#test cert', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const api = await app.getApiUrl();
        //const url = api + '/sys/info'; // 401 Unauthorized
        const url = api + '/api/ext/__test/echo';
        console.log(url);
        const echoSnippet = fs.readFileSync(path.join(__dirname, 'data/snippets/echo-snippet.js'), 'utf8');
        var response = await driver.executeAsyncScript(async (snippet) => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const data = {
                    'cmd': `module.exports = async function() {
        ${snippet}
        };`};
                const ac = app.getController().getApiController();
                const client = ac.getApiClient();
                res = await client.request('POST', '/sys/tools/dev/eval?_format=text', null, data);
            } catch (error) {
                console.log(error);
            } finally {
                callback(res);
            }
        }, echoSnippet);
        assert.equal(response, 'OK', 'Eval snippet failed');

        var error = await driver.executeAsyncScript(async (url) => {
            const callback = arguments[arguments.length - 1];

            const options = {
                //'client': 'axios',
                'method': 'POST',
                'body': 'HelloWorld'
            };
            var res;
            try {
                res = await HttpProxy.request(url, options);
            } catch (error) {
                res = error;
            }
            callback(res);
        }, url);
        //console.log(error);
        assert.equal(error['response']['status'], 500);
        assert.ok(error['response']['body'].endsWith('self-signed certificate'));

        const certSnippet = fs.readFileSync(path.join(__dirname, 'data/snippets/cert-snippet.js'), 'utf8');
        response = await driver.executeAsyncScript(async (snippet) => {
            const callback = arguments[arguments.length - 1];

            /*const data = {
                'cmd': `async function test() {
    controller.getWebClientController().setDefaultWebClient('axios');
    return Promise.resolve('OK');
};

module.exports = test;`};*/

            var res;
            try {
                const data = {
                    'cmd': `module.exports = async function() {
        ${snippet}
        };`};
                const ac = app.getController().getApiController();
                const client = ac.getApiClient();
                res = await client.request('POST', '/sys/tools/dev/eval?_format=text', null, data);
            } catch (error) {
                console.log(error);
            } finally {
                callback(res);
            }
        }, certSnippet);
        assert.equal(response, 'OK', 'Eval snippet failed');

        const ac = app.getApiController();
        await ac.restart(true);
        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.prepare(helper.getConfig()['api']);
        await ExtendedTestHelper.delay(1000);

        response = await driver.executeAsyncScript(async (snippet) => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const data = {
                    'cmd': `module.exports = async function() {
        ${snippet}
        };`};
                const ac = app.getController().getApiController();
                const client = ac.getApiClient();
                res = await client.request('POST', '/sys/tools/dev/eval?_format=text', null, data);
            } catch (error) {
                console.log(error);
            } finally {
                callback(res);
            }
        }, echoSnippet);
        assert.equal(response, 'OK', 'Eval snippet failed');

        response = await driver.executeAsyncScript(async (url) => {
            const callback = arguments[arguments.length - 1];

            const options = {
                //'client': 'axios',
                'method': 'POST',
                'body': 'HelloWorld'
            };
            var res;
            try {
                res = await HttpProxy.request(url, options);
            } catch (error) {
                res = error;
            }
            callback(res);
        }, url);
        //assert.equal(response.startsWith('\r\n<!DOCTYPE html>'), true);
        assert.equal(response, 'HelloWorld');

        return Promise.resolve();
    });

    it('#test response type', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const api = await app.getApiUrl();
        //const url = api + '/sys/info'; // 401 Unauthorized
        const url = api + '/api/ext/__test/echo';
        console.log(url);

        const echoSnippet = fs.readFileSync(path.join(__dirname, 'data/snippets/echo-snippet.js'), 'utf8');
        var response = await driver.executeAsyncScript(async (snippet) => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const data = {
                    'cmd': `module.exports = async function() {
        ${snippet}
        };`};
                const ac = app.getController().getApiController();
                const client = ac.getApiClient();
                res = await client.request('POST', '/sys/tools/dev/eval?_format=text', null, data);
            } catch (error) {
                console.log(error);
            } finally {
                callback(res);
            }
        }, echoSnippet);
        assert.equal(response, 'OK', 'Eval snippet failed');

        response = await driver.executeAsyncScript(async (url) => {
            const callback = arguments[arguments.length - 1];

            const options = {
                'client': 'axios',
                'method': 'POST',
                //'responseType': 'text',
                'headers': {
                    'Content-Type': 'text/plain',
                    //'Accept': 'application/pdf'
                },
                'body': 'HelloWorld'
            };
            var res;
            try {
                res = await HttpProxy.request(url, options);
            } catch (error) {
                res = error;
            }
            callback(res);
        }, url);
        assert.equal(response, 'HelloWorld');

        return Promise.resolve();
    });
});