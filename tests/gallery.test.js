const path = require('path');
const fs = require('fs');
const os = require('os');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - gallery', function () {

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

        const ext = 'gallery';
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

    it('#test create images', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/image.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await helper.getModelController().addModel(model);
        console.log(id);

        const app = helper.getApp();
        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

        var data = {
            'title': 'Testbild',
            'file': {
                'filename': 'Testbild.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png'
            }
        }
        var response = await app.create('image', data);

        data = {
            'title': 'Testcard',
            'file': {
                'filename': 'Testcard.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Sj%C3%B3nvarpi%C3%B0_Testcard.jpg'
            }
        }
        response = await app.create('image', data);

        return Promise.resolve();
    });

    it('#test create gallery', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/gallery.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await helper.getModelController().addModel(model);
        console.log(id);

        const app = helper.getApp();
        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('other');
        await TestHelper.delay(1000);
        await sidemenu.click('image');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);

        const cmdCtrl = os.platform().includes('darwin') ? webdriver.Key.COMMAND : webdriver.Key.CONTROL;
        await driver.actions()
            .click(panels[0])
            .keyDown(cmdCtrl)
            .sendKeys('a')
            .keyUp(cmdCtrl)
            .perform();
        /*await panels[0].click();
        await driver.actions().keyDown(cmdCtrl)
            .click(panels[1])
            .keyUp(cmdCtrl)
            .perform();*/
        await TestHelper.delay(1000);

        await driver.actions().keyDown(cmdCtrl)
            .sendKeys('c')
            .keyUp(cmdCtrl)
            .perform();
        /*await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        var xpath = `/html/body/ul[@class="contextmenu"]/li[text()="Copy"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();*/
        await TestHelper.delay(1000);

        sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('other');
        await TestHelper.delay(1000);
        await sidemenu.click('gallery');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, undefined);
        var form = await helper.getForm(panel);
        var input = await helper.getFormInput(form, 'title');
        assert.notEqual(input, undefined);
        await input.sendKeys('TestGallery');
        await TestHelper.delay(100);
        var button = await helper.getButton(panel, 'Create');
        assert.notEqual(button, undefined);
        await button.click();

        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li[text()="Paste"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li[text()="Save"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li[starts-with(text(),"Extensions")]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);
        xpath = `/html/body/ul[@class="contextmenu"]/li[starts-with(text(),"Extensions")]/div/ul[@class="contextmenu"]/li[text()="Gallery"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);

        await driver.actions()
            .sendKeys(webdriver.Key.ESCAPE)
            .perform();
        await TestHelper.delay(1000);

        return Promise.resolve();
    });
});