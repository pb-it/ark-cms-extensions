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

        const ext = 'gallery';
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);

        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const window = app.getWindow();
        const modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test create images', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/image.json'), 'utf8');
        const model = JSON.parse(str);

        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);
        console.log(id);

        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

        const ds = app.getDataService();
        var data = {
            'title': 'Testbild',
            'file': {
                'filename': 'Testbild_1.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png'
            }
        }
        var response = await ds.create('image', data);

        data = {
            'title': 'Testcard',
            'file': {
                'filename': 'Testcard.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Sj%C3%B3nvarpi%C3%B0_Testcard.jpg'
            }
        }
        response = await ds.create('image', data);

        return Promise.resolve();
    });

    it('#test create gallery', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/gallery.json'), 'utf8');
        const model = JSON.parse(str);
        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);
        console.log(id);

        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
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
        var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Copy"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();*/
        await TestHelper.delay(1000);

        sidemenu = window.getSideMenu();
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
        var form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, undefined);
        await input.sendKeys('TestGallery');
        await TestHelper.delay(100);
        var button = await window.getButton(panel, 'Create');
        assert.notEqual(button, undefined);
        await button.click();

        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Paste"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Save"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Extensions"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await TestHelper.delay(1000);
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Extensions"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="Gallery"]`;
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