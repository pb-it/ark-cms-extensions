const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - stocks', function () {

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

        var ext = 'stocks';
        var file = path.resolve(__dirname, "../dist/" + ext + ".zip");
        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);
        /*ext = 'scraper';
        file = path.resolve(__dirname, "../dist/" + ext + ".zip");
        await app.getExtensionController().addExtension(ext, file, true);*/

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test create stock', async function () {
        this.timeout(30000);

        var bScraper;
        const app = helper.getApp();
        const ds = app.getDataService();
        var data = await ds.read('_extension');
        for (var ext of data) {
            if (ext['name'] == 'scraper') {
                bScraper = true;
                break;
            }
        }
        if (bScraper) {
            data = await ds.read('scraper', null, 'domain=www.finanzen.net');
            if (!data || data.length != 1)
                bScraper = false;
        }

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('stocks');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('stock');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input;
        var button;
        if (bScraper) {
            input = await form.getFormInput('url');
            assert.notEqual(input, undefined);
            await input.sendKeys('https://www.finanzen.net/aktien/nvidia-aktie');
            await ExtendedTestHelper.delay(100);
            button = await panel.getButton('Check');
            assert.notEqual(button, undefined);
            await button.click();
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            form = await panel.getForm();
            assert.notEqual(form, null);
            input = await form.getFormInput('name');
            var str = await input.getAttribute('value');
            assert.equal(str, 'NVIDIA');
            input = await form.getFormInput('wkn');
            str = await input.getAttribute('value');
            assert.equal(str, '918422');
            input = await form.getFormInput('isin');
            str = await input.getAttribute('value');
            assert.equal(str, 'US67066G1040');
            input = await form.getFormInput('symbol');
            str = await input.getAttribute('value');
            assert.equal(str, 'NVDA');
        } else {
            input = await form.getFormInput('name');
            assert.notEqual(input, undefined);
            await input.sendKeys('NVIDIA');
            await ExtendedTestHelper.delay(100);
        }
        button = await panel.getButton('Create');
        assert.notEqual(button, undefined);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test create transaction', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('stocks');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('transaction');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('datetime');
        assert.notEqual(input, undefined);
        const date = new Date();
        const isoString = date.toISOString().replace('T', ' ').split('.')[0];
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(100);

        var elem = await form.getElement().findElement(webdriver.By.css('select#type > option[value="buy"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(100);

        input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"stock")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"stock")]/option[text()="NVIDIA"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(100);

        input = await form.getFormInput('amount');
        assert.notEqual(input, undefined);
        await input.sendKeys('1');
        await ExtendedTestHelper.delay(100);

        input = await form.getFormInput('total');
        assert.notEqual(input, undefined);
        await input.sendKeys('6.50');
        await ExtendedTestHelper.delay(100);

        var button = await panel.getButton('Create');
        assert.notEqual(button, undefined);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test balance', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('stocks');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Balance');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, undefined);

        return Promise.resolve();
    });
});