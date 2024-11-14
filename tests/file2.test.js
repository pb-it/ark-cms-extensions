const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - File2', function () {

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

        await app.resetLocalStorage();
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

        const ext = 'file2';
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

    xit('#test add model', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/file2.json'), 'utf8');
        const model = JSON.parse(str);
        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);
        console.log(id);

        return Promise.resolve();
    });

    it('#test add model', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var models = await ds.read('_model');
        var model;
        var tmp = models.filter(function (x) { return x['definition']['name'] === 'file2' });
        if (tmp.length == 1)
            model = tmp[0]
        if (model) {
            tmp = await ds.read('file2');
            if (tmp.length > 0) {
                for (var entry of tmp) {
                    await ds.delete('file2', entry['id']);
                }
            }
            await ds.delete('_model', model['id']);

            await app.reload();
            await ExtendedTestHelper.delay(1000);
            await app.login();
            await ExtendedTestHelper.delay(1000);
        }

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('New');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('file2');
        var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
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
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('url');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="url"]'));
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
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('file');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="file2"]'));
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
        elem = await form.getElement().findElement(webdriver.By.css('select#storage > option[value="database(base64)"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        const xpathFieldsetCustom = './/fieldset[./input[@type="checkbox" and @name="bCustomFilename"]]';
        var fieldsetCustom = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetCustom));
        assert.notEqual(fieldsetCustom, null, 'Input not found!');
        var bDisabled = await fieldsetCustom.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        elem = await form.getElement().findElement(webdriver.By.css('select#filename_prop > option[value="title"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        elem = await form.getElement().findElement(webdriver.By.css('select#url_prop > option[value="url"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        fieldsetCustom = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetCustom));
        bDisabled = await fieldsetCustom.getAttribute('disabled');
        assert.equal(bDisabled, null);

        elem = await form.getElement().findElement(webdriver.By.css('select#storage > option[value="filesystem"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        elem = await form.getElement().findElement(webdriver.By.css('select#cdn > option[value="/cdn"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        fieldsetCustom = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetCustom));
        bDisabled = await fieldsetCustom.getAttribute('disabled');
        assert.equal(bDisabled, null);
        input = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bCustomFilename"]'));
        assert.equal(await input.isSelected(), true);
        const xpathFieldsetSuggest = './/fieldset[./input[@type="checkbox" and @name="bSuggestFilename"]]';
        var fieldsetSuggest = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetSuggest));
        bDisabled = await fieldsetSuggest.getAttribute('disabled');
        assert.equal(bDisabled, null);
        await input.click();
        await ExtendedTestHelper.delay(1000);
        assert.equal(await input.isSelected(), false);
        fieldsetSuggest = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetSuggest));
        bDisabled = await fieldsetSuggest.getAttribute('disabled');
        assert.equal(bDisabled, 'true');

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                var form;
                const controller = app.getController();
                const modals = controller.getModalController().getModals();
                if (modals.length > 0) {
                    const panel = modals[modals.length - 1].getPanel();
                    if (panel && panel instanceof FormPanel) {
                        /*const obj = panel.getObject();
                        const model = obj.getModel();
                        const data = obj.getData();*/

                        form = panel.getForm();
                    }
                }
                if (form)
                    res = await form.readForm();
                else
                    throw new Error('Form not found');
            } catch (error) {
                alert('Error');
                console.error(error);
                res = null;
            } finally {
                callback(res);
            }
        });
        assert.equal(response?.filename_prop, 'title');
        //assert.equal(response.hasOwnProperty('bSuggestFilename'), false);

        elem = await form.getElement().findElement(webdriver.By.css('select#storage > option[value="database(base64)"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        elem = await form.getElement().findElement(webdriver.By.css('select#filename_prop'));
        assert.notEqual(elem, null, 'Select not found!');
        var value = await elem.getAttribute('value');
        assert.equal(value, 'title');
        fieldsetCustom = await form.getElement().findElement(webdriver.By.xpath(xpathFieldsetCustom));
        bDisabled = await fieldsetCustom.getAttribute('disabled');
        assert.equal(bDisabled, null);
        input = form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bCustomFilename"]'));
        assert.notEqual(input, null, 'Input not found!');
        value = await input.getAttribute('value');
        assert.equal(value, 'on');

        elem = await form.getElement().findElement(webdriver.By.css('select#storage > option[value="filesystem"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

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

        modal = await window.getTopModal();
        assert.equal(modal, null);

        models = await ds.read('_model');
        tmp = models.filter(function (x) { return x['definition']['name'] === 'file2' });
        assert.ok(tmp.length == 1);
        model = tmp[0];
        tmp = model['definition']['attributes'].filter(function (x) { return x['name'] === 'file' });
        assert.ok(tmp.length == 1);
        const attr = tmp[0];
        assert.equal(attr.hasOwnProperty('filename_prop'), false);
        assert.equal(attr.hasOwnProperty('bSuggestFilename'), false);

        return Promise.resolve();
    });

    xit('#test create file', async function () {
        this.timeout(60000);

        const data = {
            'title': 'bbb',
            'file': {
                'url': 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
        }

        const app = helper.getApp();
        const ds = app.getDataService();
        const res = await ds.create('file2', data);
        assert.notEqual(Object.keys(res).length, 0);

        return Promise.resolve();
    });

    it('#test create file', async function () {
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
        await sidemenu.click('file2');
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
        await input.sendKeys('bbb');
        await ExtendedTestHelper.delay(100);
        const inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 8)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://www.w3schools.com/html/mov_bbb.mp4');
        await ExtendedTestHelper.delay(1000);
        input = inputs[5];
        assert.equal(await input.getAttribute('disabled'), 'true');
        //var value = await input.getAttribute('value');
        //assert.equal(value, 'mov_bbb.mp4');

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(30);
        const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
        const display = await overlay.getCssValue('display');
        assert.equal(display, 'none');

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test delete file', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var tmp = await ds.read('file2');
        assert.equal(tmp.length, 1);
        const data = tmp[0];
        var file;
        if (config['cdn'])
            file = path.join(config['cdn'], data['file']);
        if (file)
            assert.ok(fs.existsSync(file));

        await app.navigate('/data/file2/' + data['id']);
        const window = app.getWindow();
        /*const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('file2');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);*/

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

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

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var div = await modal.findElement(webdriver.By.xpath(`./div[@class="modal-content"]/div[@class="panel"]/div[@class="pre"]`));
        assert.notEqual(modal, null);
        var text = await div.getText();
        assert.ok(text.startsWith('ERROR:\n404: Not Found'));
        await modal.closeModal();

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 0);
        if (file)
            assert.ok(!fs.existsSync(file));

        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test funcFileName', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        var bDebugMode = await app.isDebugModeActive();
        if (!bDebugMode)
            await app.setDebugMode(true);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Extensions');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('file2');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Configure');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('funcFileName');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys(`if (model)
    console.log(model.getName());
console.log(data);
console.log(old);
return Promise.resolve('test.png');`);
        var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('file2');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('title');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('test');
        var entry = await form.getFormEntry('file');
        assert.notEqual(entry, null);
        var inputs = await entry.findElements(webdriver.By.xpath(`./div[@class="value"]/input`));
        assert.equal(inputs.length, 3);
        input = inputs[1];
        await input.sendKeys('https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            var modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var obj = await ExtendedTestHelper.readJson(window, panels[0]);
        assert.equal(obj['file'], 'test.png');

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var elements = await modal.findElements(webdriver.By.xpath(`//input[@type="submit" and @name="confirm"]`));
        assert.equal(elements.length, 1);
        button = elements[0];
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var div = await modal.findElement(webdriver.By.xpath(`./div[@class="modal-content"]/div[@class="panel"]/div[@class="pre"]`));
        assert.notEqual(modal, null);
        var text = await div.getText();
        assert.ok(text.startsWith('ERROR:\n404: Not Found'));
        await modal.closeModal();

        const ds = app.getDataService();
        var tmp = await ds.delete('_registry', 'ext.file2.funcFileName');
        assert.notEqual(Object.keys(tmp).length, 0);

        tmp = await ds.request('GET', '/api/ext/file2/init');
        assert.equal(tmp, 'OK');

        return Promise.resolve();
    });
});