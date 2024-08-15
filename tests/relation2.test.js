const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Relation2', function () {

    async function setupScenario(bClean) {
        const app = helper.getApp();
        if (bClean) {
            const ac = app.getApiController();
            await app.resetLocalStorage();
            await ac.clearDatabase();

            await ac.restart(true);
            await app.reload();
            await ExtendedTestHelper.delay(1000);
            await app.prepare(helper.getConfig()['api']);
            await ExtendedTestHelper.delay(1000);

            const modal = await app.getWindow().getTopModal();
            assert.equal(modal, null);

            const tools = ac.getTools();
            const cmd = `async function test() {
    await controller.getExtensionController().clearExtensionsDirectory();
    return Promise.resolve('OK');
};
module.exports = test;`
            const res = await tools.serverEval(cmd);
            assert.equal(res, 'OK', 'Deleting old extensions failed');
        }

        /*const model = {
            "name": "star",
            "options": {
                "increments": true,
                "timestamps": true
            },
            "attributes": [
                {
                    "name": "name",
                    "dataType": "string"
                }
            ]
        }
        await helper.getApp().getModelController().addModel(model);*/
        await helper.setupModel(path.join(__dirname, './data/models/star.json'));

        const data = [
            {
                'name': 'John Doe'
            },
            {
                'name': 'Jane Doe'
            }
        ];
        await helper._setupData('star', data, true);
        return Promise.resolve();
    }

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

    async function addTitleAttribute(window, modelModal) {
        var button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('title');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="string"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    }

    async function addRelAttribute(window, modelModal, name, multiple) {
        var button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys(name);
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="relation2"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="star"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        //var formEntry = await form.getFormEntry('multiple');
        var formEntry = await form.getElement().findElement(webdriver.By.xpath(`./div[@class="formentry" and starts-with(@id, "form:multiple:")]`));
        assert.notEqual(formEntry, null);
        var option = await formEntry.findElement(webdriver.By.xpath('./div[@class="value"]/select/option[@value="' + multiple + '"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    }

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

        //await helper.setupScenario(1);
        await setupScenario(false);
        await ExtendedTestHelper.delay(1000);

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

        const ext = 'relation2';
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

    it('#test create model', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        const name = 'dummy';
        const ds = app.getDataService();
        var models = await ds.read('_model');
        var model;
        var tmp = models.filter(function (x) { return x['definition']['name'] === name });
        if (tmp.length == 1)
            model = tmp[0]
        if (model) {
            try {
                tmp = await ds.read(name);
                if (tmp.length > 0) {
                    for (var entry of tmp) {
                        await ds.delete(name, entry['id']);
                    }
                }
                await ds.delete('_model', model['id']);

                await app.reload();
                await ExtendedTestHelper.delay(1000);
                await app.login();
                await ExtendedTestHelper.delay(1000);
            } catch (error) {
                console.log(error);
            }
        }

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('New');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys(name);
        var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        await addTitleAttribute(window, modelModal);
        await addRelAttribute(window, modelModal, 'rel2', false);
        await addRelAttribute(window, modelModal, 'rel2m', true);

        button = await modelModal.findElement(webdriver.By.xpath('.//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Ignore"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test create entry', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.setDebugMode(true);

        /*await app.navigate('/data/dummy');
        await ExtendedTestHelper.delay(1000);
        const window = app.getWindow();*/

        const ds = app.getDataService();
        var tmp = await ds.read('star', null, 'name=John Doe');
        assert.equal(tmp.length, 1);
        const john = tmp[0];
        tmp = await ds.read('star', null, 'name=Jane Doe');
        assert.equal(tmp.length, 1);
        const jane = tmp[0];

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('dummy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('test');
        await ExtendedTestHelper.delay(1000);
        input = await form.getElement().findElement(webdriver.By.xpath('.//div[@class="select"]/input[starts-with(@list,"rel2")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('.//div[@class="select"]/datalist[starts-with(@id,"rel2")]/option[text()="John Doe"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);
        input = await form.getElement().findElement(webdriver.By.xpath('.//div[@class="select"]/input[starts-with(@list,"rel2m")]'));
        assert.notEqual(input, null);
        option = await form.getElement().findElement(webdriver.By.xpath('.//div[@class="select"]/datalist[starts-with(@id,"rel2m")]/option[text()="John Doe"]'));
        assert.notEqual(option, null);
        value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);
        option = await form.getElement().findElement(webdriver.By.xpath('.//div[@class="select"]/datalist[starts-with(@id,"rel2m")]/option[text()="Jane Doe"]'));
        assert.notEqual(option, null);
        value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var modal;
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var obj = await readJson(window, panels[0]);
        assert.equal(obj['rel2']['id'], john['id']);
        assert.equal(obj['rel2m'].length, 2);
        assert.equal(obj['rel2m'][0]['id'], john['id']);
        assert.equal(obj['rel2m'][1]['id'], jane['id']);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('title');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'test');

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test delete entry', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('dummy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var elements = await modal.findElements(webdriver.By.xpath(`//input[@type="submit" and @name="confirm"]`));
        assert.equal(elements.length, 1);
        var button = elements[0];
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 0);

        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });
});