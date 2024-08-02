const path = require('path');
const fs = require('fs');
const os = require('os');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - backup', function () {

    async function readJson(window, panel) {
        var contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Debug');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('JSON');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var jsonPanel = await modal.getPanel();
        assert.notEqual(jsonPanel, null);
        var div = await jsonPanel.getElement().findElement(webdriver.By.xpath('./div'));
        assert.notEqual(div, null);
        var text = await div.getText();
        var obj = JSON.parse(text);
        //console.log(obj);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);
        return Promise.resolve(obj);
    }

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

        const ext = 'backup';
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

    it('#test create backup', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        var bDebugMode = await app.isDebugModeActive();
        if (!bDebugMode)
            await app.setDebugMode(true);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('backup');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('backup');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('description');
        assert.notEqual(input, null);
        await input.sendKeys('bla');
        await ExtendedTestHelper.delay(1000);

        bDebugMode = await app.isDebugModeActive();
        button = await window.getButton(panel.getElement(), 'Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        var modal;
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await app.waitLoadingFinished(10);
        }
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var obj = await readJson(window, panels[0]);
        assert.notEqual(obj, null);
        var filename = obj['file'];
        assert.notEqual(filename, null);

        var file;
        if (config['cdn'])
            file = path.join(config['cdn'], filename);
        if (file)
            assert.ok(fs.existsSync(file));

        contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //button = await helper.getButton(modal, 'Confirm');
        button = await modal.findElement(webdriver.By.xpath(`//input[@type="submit" and @name="confirm"]`));
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        if (file)
            assert.ok(!fs.existsSync(file));

        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });
});