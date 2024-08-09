const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Dashboard', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

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
        this.timeout(60000);

        const ext = 'dashboard';
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

    it('#test dashboard', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        var bDebugMode = await app.isDebugModeActive();
        if (!bDebugMode)
            await app.setDebugMode(true);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('_model');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        menu = await sidemenu.getEntry('Dashboard');
        assert.equal(menu, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('_model');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //const tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        const tabPanel = await modal.getPanel();
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Dashboard"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var panel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var input = await panel.findElement(webdriver.By.xpath(`.//textarea`));
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '');

        const code = `alert('hello');
return Promise.resolve(new Panel());`
        await input.sendKeys(code);
        await ExtendedTestHelper.delay(1000);

        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('_model');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Dashboard');
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'hello');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });
});