const path = require('path');
const https = require('https');
//const fetch = require('node-fetch');
const fetch = require('cross-fetch');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Menu } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - backup', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

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

        const ext = 'dlh';
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

    it('#test dlh', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const api = await app.getApiUrl();
        const url = api + '/api/ext/dlh/info';

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
        if (data['version']) {
            var tmp;
            var sidemenu;
            var modal, panel, form, input;
            const window = app.getWindow();
            const ds = app.getDataService();
            tmp = await ds.delete('_registry', 'dlhConfig');
            assert.notEqual(Object.keys(tmp).length, 0);

            tmp = await ds.read('_registry', null, 'key=dlhConfig');
            var bNative;
            if (tmp && tmp.length == 1)
                bNative = JSON.parse(tmp[0]['value'])['bNative'];
            if (!bNative) {
                sidemenu = window.getSideMenu();
                await sidemenu.click('Extensions');
                await app.waitLoadingFinished(10);
                await ExtendedTestHelper.delay(1000);

                var canvas = await window.getCanvas();
                assert.notEqual(canvas, null);
                var panel = await canvas.getPanel('dlh');
                assert.notEqual(panel, null);
                var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
                var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
                assert.notEqual(element, null);
                var menu = new Menu(helper, element);
                await menu.open();
                await ExtendedTestHelper.delay(1000);
                await menu.click('Configure');
                await ExtendedTestHelper.delay(1000);

                modal = await window.getTopModal();
                assert.notEqual(modal, null);
                panel = await modal.getPanel();
                assert.notEqual(panel, null);
                form = await panel.getForm();
                assert.notEqual(form, null);
                input = await panel.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bNative"]'));
                assert.notEqual(input, null, 'Input not found!');
                var bDisabled = await input.getAttribute('disabled');
                assert.equal(bDisabled, null);
                //var value = await input.getAttribute('value'); // 'on'
                var bSelected = await input.isSelected();
                if (!bSelected)
                    await input.click();
                await ExtendedTestHelper.delay(1000);
                assert.equal(await input.isSelected(), true);

                var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
                assert.notEqual(button, null, 'Button not found!');
                await button.click();
                if (!bSelected) {
                    await driver.wait(webdriver.until.alertIsPresent(), 1000);
                    var alert = await driver.switchTo().alert();
                    var text = await alert.getText();
                    assert.equal(text, 'Changes applied successfully.');
                    await alert.accept();
                }
                await ExtendedTestHelper.delay(1000);
                modal = await app.getWindow().getTopModal();
                assert.equal(modal, null);
            }

            var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="DownloadHelper"]`;
            var elements = await driver.findElements(webdriver.By.xpath(xpath));
            if (elements.length == 0) {
                sidemenu = window.getSideMenu();
                await sidemenu.click('Apps');
                await app.waitLoadingFinished(10);
                await ExtendedTestHelper.delay(1000);

                var canvas = await window.getCanvas();
                assert.notEqual(canvas, null);
                var panel = await canvas.getPanel('DownloadHelper');
                assert.notEqual(panel, null);
                var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
                var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
                assert.notEqual(element, null);
                var menu = new Menu(helper, element);
                await menu.open();
                await ExtendedTestHelper.delay(1000);
                await menu.click('Pin to Sidemenu');
                await app.waitLoadingFinished(10);
                await ExtendedTestHelper.delay(1000);
            }

            sidemenu = window.getSideMenu();
            await sidemenu.click('DownloadHelper');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 1);
            panel = panels[0];
            button = await panel.getElement().findElement(webdriver.By.xpath(`.//button[text()="Add"]`));
            assert.notEqual(button, null, 'Button not found!');
            await button.click();
            await ExtendedTestHelper.delay(1000);
            modal = await app.getWindow().getTopModal();
            assert.notEqual(modal, null);
            panel = await modal.getPanel();
            assert.notEqual(panel, null);
            form = await panel.getForm();
            assert.notEqual(form, null);
            input = await form.getFormInput('url');
            assert.notEqual(input, null);
            await input.sendKeys('https://www.youtube.com/watch?v=9Ht5RZpzPqw');
            await ExtendedTestHelper.delay(1000);
            input = await form.getFormInput('options');
            assert.notEqual(input, null);
            await input.sendKeys('-S res:360 -f "bestvideo*[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"');
            await ExtendedTestHelper.delay(1000);
            button = await panel.getElement().findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
            assert.notEqual(button, null, 'Button not found!');
            await button.click();
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);
        } else
            this.skip();
        return Promise.resolve();
    });

    it('#test dlh ruleset', async function () {
        this.timeout(60000);

        const app = helper.getApp();

        var sidemenu;
        var modal, panel, form, input;
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Extensions');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel('dlh');
        assert.notEqual(panel, null);
        var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
        var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
        assert.notEqual(element, null);
        var menu = new Menu(helper, element);
        await menu.open();
        await ExtendedTestHelper.delay(1000);
        await menu.click('Configure');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await panel.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bNative"]'));
        assert.notEqual(input, null, 'Input not found!');
        var bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, null);
        //var value = await input.getAttribute('value'); // 'on'
        var bSelected = await input.isSelected();
        if (bSelected)
            await input.click();
        await ExtendedTestHelper.delay(1000);
        assert.equal(await input.isSelected(), false);
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('funcRuleset');
        assert.notEqual(input, null);
        await input.sendKeys('return Promise.resolve([{ \'regex\': \'^.*$\', \'client\': \'yt-dlp-native\' }]);');
        await ExtendedTestHelper.delay(1000);

        var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        if (bSelected) {
            await driver.wait(webdriver.until.alertIsPresent(), 1000);
            var alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Changes applied successfully.');
            await alert.accept();
        }
        await ExtendedTestHelper.delay(1000);
        modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('DownloadHelper');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        panel = panels[0];
        button = await panel.getElement().findElement(webdriver.By.xpath(`.//button[text()="Add"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await app.getWindow().getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('url');
        assert.notEqual(input, null);
        await input.sendKeys('https://www.youtube.com/watch?v=9Ht5RZpzPqw');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getElement().findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });
});