const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Clipboard2', function () {

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
        this.timeout(30000);

        const ext = 'clipboard2';
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

    it('#test clipboard2', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        window.getTopNavigationBar()
        const xpath = `//*[@id="topnav"]/div/div/i[contains(@class, 'fa-paperclip')]`;
        var buttons = await driver.findElements(webdriver.By.xpath(xpath));
        assert.equal(buttons.length, 1);
        await buttons[0].click();

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var button = await panel.getButton('Add');
        assert.notEqual(button, null);
        await button.click();
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Key:');
        await alert.sendKeys('test');
        await ExtendedTestHelper.delay(1000);
        await alert.accept();
        await ExtendedTestHelper.delay(1000);
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Value:');
        await alert.sendKeys('123');
        await ExtendedTestHelper.delay(1000);
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        var elements = await panel.getElement().findElements(webdriver.By.xpath('./div/ul/li'));
        assert.equal(elements.length, 1);
        text = await elements[0].getText();
        assert.equal(text, 'testEditDelete');

        button = await panel.getButton('Delete');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        elements = await panel.getElement().findElements(webdriver.By.xpath('./div/ul/li'));
        assert.equal(elements.length, 0);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});