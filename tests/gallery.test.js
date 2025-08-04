const path = require('path');
const fs = require('fs');
const os = require('os');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - gallery', function () {

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

        const ext = 'gallery';
        const file = path.resolve(__dirname, "../dist/" + ext + ".zip");

        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

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
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

        const ds = app.getDataService();
        var data = {
            'title': 'Testbild',
            'file': {
                'filename': 'Testbild_1.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png'
            }
        }
        var response = await ds.create('image', data);
        assert.notEqual(Object.keys(response).length, 0);

        data = {
            'title': 'Testcard',
            'file': {
                'filename': 'Testcard.png',
                'url': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Sj%C3%B3nvarpi%C3%B0_Testcard.jpg'
            }
        }
        response = await ds.create('image', data);
        assert.notEqual(Object.keys(response).length, 0);

        return Promise.resolve();
    });

    it('#test create gallery', async function () {
        this.timeout(60000);

        if (config['browser']['name'].toLowerCase() === 'chrome') {
            const str = fs.readFileSync(path.join(__dirname, './data/models/gallery.json'), 'utf8');
            const model = JSON.parse(str);
            const app = helper.getApp();
            const id = await app.getModelController().addModel(model);
            console.log(id);

            await app.reload();
            await ExtendedTestHelper.delay(1000);
            await app.login();
            await ExtendedTestHelper.delay(1000);

            const window = app.getWindow();
            var sidemenu = window.getSideMenu();
            await sidemenu.click('Data');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('image');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Show');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('All');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 2);

            const cmdCtrl = os.platform().includes('darwin') ? webdriver.Key.COMMAND : webdriver.Key.CONTROL;
            await driver.actions()
                .click(panels[0].getElement())
                .keyDown(cmdCtrl)
                .sendKeys('a')
                .keyUp(cmdCtrl)
                .perform();
            /*await panels[0].click();
            await driver.actions().keyDown(cmdCtrl)
                .click(panels[1])
                .keyUp(cmdCtrl)
                .perform();*/
            await ExtendedTestHelper.delay(1000);

            await driver.actions().keyDown(cmdCtrl)
                .sendKeys('c')
                .keyUp(cmdCtrl)
                .perform();
            /*await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
            var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Copy"]`;
            var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
            assert.notEqual(item, null);
            await item.click();*/
            await ExtendedTestHelper.delay(1000);

            sidemenu = window.getSideMenu();
            await sidemenu.click('Data');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('gallery');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Create');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panel = await canvas.getPanel();
            assert.notEqual(panel, null);
            var form = await panel.getForm();
            assert.notEqual(form, null);
            var input = await form.getFormInput('title');
            assert.notEqual(input, undefined);
            await input.sendKeys('TestGallery');
            await ExtendedTestHelper.delay(100);
            var button = await panel.getButton('Create');
            assert.notEqual(button, undefined);
            await button.click();
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            panels = await canvas.getPanels();
            assert.equal(panels.length, 1);

            var contextmenu = await panels[0].openContextMenu();
            await ExtendedTestHelper.delay(1000);
            await contextmenu.click('Paste');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            contextmenu = await panels[0].openContextMenu();
            await ExtendedTestHelper.delay(1000);
            await contextmenu.click('Save');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var xpath = `.//div/ul/li/div[contains(@class, 'panel')]`;
            var elements = await panels[0].getElement().findElements(webdriver.By.xpath(xpath));
            assert.equal(elements.length, 2);

            contextmenu = await panels[0].openContextMenu();
            await ExtendedTestHelper.delay(1000);
            await contextmenu.click('Extensions');
            await ExtendedTestHelper.delay(1000);
            await contextmenu.click('Gallery');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            xpath = `/html/body/div[contains(@class, 'pswp')]`;
            var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
            assert.notEqual(item, null);

            await driver.actions()
                .sendKeys(webdriver.Key.ESCAPE)
                .perform();
            await ExtendedTestHelper.delay(1000);
        } else
            this.skip();

        return Promise.resolve();
    });
});