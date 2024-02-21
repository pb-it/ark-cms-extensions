const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - stocks', function () {

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

    it('#test add extension', async function () {
        this.timeout(120000);

        var ext = 'stocks';
        var file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
        await helper.getExtensionController().addExtension(ext, file, true);
        /*ext = 'scraper';
        file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
        await helper.getExtensionController().addExtension(ext, file, true);*/

        const app = helper.getApp();
        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test create stock', async function () {
        this.timeout(30000);

        var bScraper;
        const app = helper.getApp();
        var data = await app.read('_extension');
        for (var ext of data) {
            if (ext['name'] == 'scraper') {
                bScraper = true;
                break;
            }
        }
        if (bScraper) {
            data = await app.read('scraper', null, 'domain=www.finanzen.net');
            if (!data || data.length != 1)
                bScraper = false;
        }

        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('stocks');
        await TestHelper.delay(1000);
        await sidemenu.click('stock');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, undefined);
        var form = await helper.getForm(panel);
        var input;
        var button;
        if (bScraper) {
            input = await helper.getFormInput(form, 'url');
            assert.notEqual(input, undefined);
            await input.sendKeys('https://www.finanzen.net/aktien/nvidia-aktie');
            await TestHelper.delay(100);
            button = await helper.getButton(panel, 'Check');
            assert.notEqual(button, undefined);
            await button.click();

            const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
            var display = await overlay.getCssValue('display');
            if (display == 'none')
                await TestHelper.delay(1000);

            var i = 0;
            while (display == 'block' && i < 30) {
                await TestHelper.delay(1000);
                display = await overlay.getCssValue('display');
                i++;
            }
            assert.equal(await overlay.getCssValue('display'), 'none');

            form = await helper.getForm(panel);
            input = await helper.getFormInput(form, 'name');
            var str = await input.getAttribute('value');
            assert.equal(str, 'NVIDIA');
            input = await helper.getFormInput(form, 'wkn');
            str = await input.getAttribute('value');
            assert.equal(str, '918422');
            input = await helper.getFormInput(form, 'isin');
            str = await input.getAttribute('value');
            assert.equal(str, 'US67066G1040');
            input = await helper.getFormInput(form, 'symbol');
            str = await input.getAttribute('value');
            assert.equal(str, 'NVDA');
        } else {
            input = await helper.getFormInput(form, 'name');
            assert.notEqual(input, undefined);
            await input.sendKeys('NVIDIA');
            await TestHelper.delay(100);
        }
        button = await helper.getButton(panel, 'Create');
        assert.notEqual(button, undefined);
        await button.click();

        await TestHelper.delay(1000);

        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test create transaction', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('stocks');
        await TestHelper.delay(1000);
        await sidemenu.click('transaction');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, undefined);
        var form = await helper.getForm(panel);

        var elem = await form.findElement(webdriver.By.css('select#type > option[value="buy"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await TestHelper.delay(100);

        var input = await form.findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"stock")]'));
        assert.notEqual(input, null);
        var option = await form.findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"stock")]/option[text()="NVIDIA"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await TestHelper.delay(100);

        input = await helper.getFormInput(form, 'amount');
        assert.notEqual(input, undefined);
        await input.sendKeys('1');
        await TestHelper.delay(100);

        input = await helper.getFormInput(form, 'total');
        assert.notEqual(input, undefined);
        await input.sendKeys('6.50');
        await TestHelper.delay(100);

        var button = await helper.getButton(panel, 'Create');
        assert.notEqual(button, undefined);
        await button.click();

        await TestHelper.delay(1000);

        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test balance', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('stocks');
        await TestHelper.delay(1000);
        await sidemenu.click('Balance');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, undefined);

        return Promise.resolve();
    });
});