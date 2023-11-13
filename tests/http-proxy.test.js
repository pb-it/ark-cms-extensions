const path = require('path');

const assert = require('assert');

const config = require('./config.js');
const { TestSetup, TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

var driver;
var helper;

describe('Testsuit', function () {

    before('#setup', async function () {
        this.timeout(10000);
        driver = await new TestSetup(config).getDriver();
        helper = new TestHelper(driver);

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test add extension', async function () {
        this.timeout(30000);

        const ext = 'http-proxy';
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        await helper.addExtension(ext, file, true);

        return Promise.resolve();
    });

    it('#test forward request', async function () {
        this.timeout(30000);

        await helper.login();

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

    it('#test forward formdata', async function () {
        this.timeout(10000);

        await helper.login();

        await TestHelper.delay(5000);

        //TODO:

        return Promise.resolve();
    });
});