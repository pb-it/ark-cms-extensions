const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');
//const remote = require('selenium-webdriver/remote');

class TestHelper {

    static delay = ms => new Promise(res => setTimeout(res, ms));

    _driver;

    constructor(driver) {
        this._driver = driver;
    }

    async getTopModal() {
        var modal;
        var elements = await this._driver.findElements(webdriver.By.xpath('/html/body/div[@class="modal"]'));
        if (elements && elements.length > 0)
            modal = elements[elements.length - 1];
        return Promise.resolve(modal);
    }

    async getForm(element) {
        var form;
        var elements = await element.findElements(webdriver.By.xpath('//form[@class="crudform"]'));
        if (elements && elements.length == 1)
            form = elements[0];
        return Promise.resolve(form);
    }

    async getFormInput(form, name) {
        //var formentries = await form.findElements(webdriver.By.xpath('./child::*'));
        // '//form/child::input[@type='password']'
        // '//form/input[@type='password']'
        var input;
        var elements = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input[@name="${name}"]`));
        if (elements && elements.length == 1)
            input = elements[0];
        return Promise.resolve(input);
    }

    async getButton(element, text) {
        var button;
        var elements;
        if (text == 'Create')
            elements = await element.findElements(webdriver.By.xpath(`//button[text()="${text}" and not(ancestor::div[@class="formentry"])]`));
        else
            elements = await element.findElements(webdriver.By.xpath(`//button[text()="${text}"]`));
        if (elements && elements.length == 1)
            button = elements[0];
        return Promise.resolve(button);
    }

    async login() {
        var modal = await this.getTopModal();
        if (modal) {
            var input = modal.findElement(webdriver.By.css('input[id="username"]'));
            if (input)
                input.sendKeys('admin');
            input = modal.findElement(webdriver.By.css('input[id="password"]'));
            if (input)
                input.sendKeys('admin');
            var button = await this.getButton(modal, 'Login');
            if (button)
                button.click();

            await TestHelper.delay(1000);

            modal = await this.getTopModal();
            if (modal) {
                button = await this.getButton(modal, 'Skip');
                button.click();
            }
        }
        return Promise.resolve();
    }

    async reload() {
        await this._driver.navigate().refresh();
        try { // alternative check 'bConfirmOnLeave'
            var tmp = await this._driver.switchTo().alert();
            if (tmp)
                await tmp.accept();
        } catch (error) {
            ;
        }
        await TestHelper.delay(1000);
        return Promise.resolve();
    }

    async addExtension(name, file, bRestartIfRequested) {
        //this._driver.setFileDetector(new remote.FileDetector());

        await this.login();

        var modal = await this.getTopModal();
        assert.equal(modal, null);

        // https://copyprogramming.com/howto/selenium-close-file-picker-dialog
        this._driver.executeScript(function () {
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

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Extensions"]`;
        var button;
        button = await this._driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"${name}")]`;
        var tmp = await this._driver.findElements(webdriver.By.xpath(xpath));
        var bExists = (tmp.length > 0);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"Add")]`;
        button = await this._driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//input[@type="file"]`;
        var input = await this._driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        if (input) {
            input.sendKeys(file);

            var alert;
            if (bExists) {
                await this._driver.wait(webdriver.until.alertIsPresent());
                alert = await this._driver.switchTo().alert();
                await alert.accept();
            }

            await this._driver.wait(webdriver.until.alertIsPresent());
            alert = await this._driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text.startsWith('Uploaded \'' + name + '\' successfully!'), true);
            await alert.accept();
        } else
            assert.fail("Input not found");

        if (bRestartIfRequested)
            await this.checkRestartRequest();

        return Promise.resolve();
    }

    async checkRestartRequest() {
        var response = await this._driver.executeAsyncScript(async () => {
            var callback = arguments[arguments.length - 1];
            var res = 1;
            var bRestart = false;
            const controller = app.getController();
            const ac = controller.getApiController();
            const info = await ac.fetchApiInfo();
            if (info)
                bRestart = (info['state'] === 'openRestartRequest');
            if (bRestart) {
                await ac.restartApi();
                await sleep(5000);
                var bReady = await ac.waitApiReady();
                if (bReady)
                    res = 0;
            } else
                res = 0;
            callback(res);
        });
        assert.equal(response, 0, 'Unexpected System State');
        await this.reload();

        return Promise.resolve();
    }
}

module.exports = TestHelper;