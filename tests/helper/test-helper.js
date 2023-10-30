const webdriver = require('selenium-webdriver');

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
}

module.exports = TestHelper;