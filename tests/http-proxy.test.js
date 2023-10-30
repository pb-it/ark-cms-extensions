const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');
//const remote = require('selenium-webdriver/remote');

const config = require('./config.js');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

var driver;
var helper;

describe('Testsuit', function () {
    before('description', async function () {
        driver = await new TestSetup(config).getDriver();
        helper = new TestHelper(driver);

        await TestHelper.delay(1000);
    });

    it('#test add extension', async function () {
        this.timeout(10000);

        //driver.setFileDetector(new remote.FileDetector());

        // https://copyprogramming.com/howto/selenium-close-file-picker-dialog
        driver.executeScript(function () {
            HTMLInputElement.prototype.click = function () {
                if (this.type !== 'file') {
                    HTMLElement.prototype.click.call(this);
                }
                else if (!this.parentNode) {
                    this.style.display = 'none';
                    this.ownerDocument.documentElement.appendChild(this);
                    this.addEventListener('change', () => this.remove());
                }
            }
        });

        await TestHelper.delay(1000);

        try {
            var tmp = await driver.switchTo().alert();
            if (tmp)
                await tmp.dismiss();
        } catch (error) {
            ;
        }

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Extensions"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"http-proxy")]`;
        var tmp = await driver.findElements(webdriver.By.xpath(xpath));
        var bExists = (tmp.length > 0);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"Add")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//input[@type="file"]`;
        var input = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        if (input) {
            var absolutePath = path.resolve(__dirname, "../dist/http-proxy@1.0.0.zip");
            input.sendKeys(absolutePath);

            var alert;
            if (bExists) {
                await driver.wait(webdriver.until.alertIsPresent());
                alert = await driver.switchTo().alert();
                await alert.accept();
            }

            await driver.wait(webdriver.until.alertIsPresent());
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text.startsWith('Uploaded \'http-proxy\' successfully!'), true);
            await alert.accept();
        } else
            assert.fail("Input not found");

        await driver.navigate().refresh();
        await TestHelper.delay(100);

        return Promise.resolve();
    });

    it('#test forward request', async function () {
        this.timeout(10000);

        var response = await driver.executeAsyncScript(async () => {
            var callback = arguments[arguments.length - 1];

            var url = 'https://www.google.at';
            var res = await HttpProxy.request(url);
            callback(res);
        });
        assert.equal(response.startsWith('<!doctype html>'), true);

        return Promise.resolve();
    });
});