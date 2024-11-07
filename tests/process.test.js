const path = require('path');
const https = require('https');
//const fetch = require('node-fetch');
const fetch = require('cross-fetch');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - process', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

        https.globalAgent.options.rejectUnauthorized = false;

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

        const ext = 'process';
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

    /**
     * https://localhost:3002/api/ext/test-helper/sleep?seconds=10&_batch=true
     * https://localhost:3002/api/ext/process
     */
    it('#test signal', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var tmp = await ds.read('_extension', null, 'name=test-helper');
        if (tmp.length == 1) {
            const api = await app.getApiUrl();
            const url = api + '/api/ext/test-helper/sleep?seconds=10&_batch=true';

            var response;
            var err;
            try {
                response = await fetch(url, { signal: AbortSignal.timeout(2000) });
            } catch (error) {
                err = error;
            }
            //console.log(response);
            assert.equal(err, undefined);
            assert.notEqual(response, undefined);
            var data = await response.json();
            console.log(data);
            assert.notEqual(data['url'], undefined);

            const handle = await driver.getWindowHandle();
            await driver.switchTo().newWindow('tab');

            await driver.get(api + data['url']);
            await ExtendedTestHelper.delay(1000);
            /*var html = await driver.getPageSource();
            console.log(html);
            assert.equal(html.indexOf('Signal: <b>SIGINT</b>'), -1);*/

            const xpath = `/html/body/div[contains(@class, "container")]`;
            var elements = await driver.findElements(webdriver.By.xpath(xpath));
            assert.equal(elements.length, 1);
            var text = await elements[0].getText(); // await elements[0].getAttribute('inner‌​HTML');
            assert.equal(text.indexOf('Signal: SIGINT'), -1);

            var button = await elements[0].findElement(webdriver.By.xpath(`./form/input`));
            assert.notEqual(button, undefined);
            await button.click();
            await ExtendedTestHelper.delay(1000);

            elements = await driver.findElements(webdriver.By.xpath(xpath));
            assert.equal(elements.length, 1);
            text = await elements[0].getText();
            assert.notEqual(text.indexOf('Signal: SIGINT'), -1);

            await ExtendedTestHelper.delay(1000);

            await driver.close();
            await driver.switchTo().window(handle);
        } else
            this.skip();

        return Promise.resolve();
    });
});