const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

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

    it('#test file dump', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ds = app.getDataService();
        const models = await ds.read('_model');
        var model;
        var bOk;
        var tmp = models.filter(function (x) { return x['definition']['name'] === 'http-proxy-cache' });
        if (tmp.length == 1)
            model = tmp[0];
        if (model) {
            tmp = model['definition']['attributes'].filter(function (x) { return x['name'] === 'file' });
            if (tmp.length == 1)
                bOk = true;
            else
                await ds.delete('_model', model['id']);
        }
        if (!bOk) {
            var ext;
            var file;
            var tmp = await ds.read('_extension', null, 'name=file2');
            if (tmp.length == 0) {
                ext = 'file2';
                file = path.resolve(__dirname, "../dist/" + ext + ".zip");
                await app.getExtensionController().addExtension(ext, file);
            }
            ext = 'http-proxy';
            file = path.resolve(__dirname, "../dist/" + ext + ".zip");
            await app.getExtensionController().addExtension(ext, file, true);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.login();
            await ExtendedTestHelper.delay(1000);
        }

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://example.com/';
            var res;
            try {
                await HttpProxy.request(url, { 'bCache': true });
                res = 'OK';
            } catch (error) {
                res = error;
            }
            callback(res);
        });
        assert.equal(response, 'OK');

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('http-proxy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('http-proxy-cache');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Extensions');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Dump to file');
        await ExtendedTestHelper.delay(1000);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://example.com/';
            var res;
            try {
                //res = await HttpProxy.request(url, { 'bCache': true });
                HttpProxy.request(url, { 'bCache': true }).then((result) => {
                    console.log(result);
                });
                res = 'OK';
            } catch (error) {
                res = error;
            }
            callback(res);
        });
        assert.equal(response, 'OK');

        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Use cached response?');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        //TODO: check browser log

        return Promise.resolve();
    });
});