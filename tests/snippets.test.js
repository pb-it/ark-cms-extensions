const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const { Panel, Form } = require('@pb-it/ark-cms-selenium-test-helper');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - snippets', function () {

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

        var bDep;
        const ds = app.getDataService();
        var data = await ds.read('_extension');
        for (var ext of data) {
            if (ext['name'] == 'mime-text') {
                bDep = true;
                break;
            }
        }
        assert.ok(bDep);

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

        const ext = 'snippets';
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

    xit('#test create snippet', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        var bDebugMode = await app.isDebugModeActive();

        const ds = app.getDataService();
        const models = await ds.read('_model');
        if (models.filter(function (x) { return x['definition']['name'] === 'star' }).length == 0) {
            await helper.setupModel(path.join(__dirname, './data/models/star.json'));

            await app.reload();
            await ExtendedTestHelper.delay(1000);
        }

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('snippets');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, undefined);
        await input.sendKeys('TestSnippet');
        await ExtendedTestHelper.delay(1000);
        input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"model")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"model")]/option[text()="star"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);
        var elem = await form.getElement().findElement(webdriver.By.css('select#environment > option[value="browser"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        var button = await panel.getButton('Create');
        assert.notEqual(button, undefined);
        await button.click();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test create snippet #2', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        var bDebugMode = await app.isDebugModeActive();

        const ds = app.getDataService();
        const models = await ds.read('_model');
        var tmp = models.filter(function (x) { return x['definition']['name'] === 'star' });
        /*if (tmp.length == 0) {
            await helper.setupModel(path.join(__dirname, './data/models/star.json'));

            await app.reload();
            await ExtendedTestHelper.delay(1000);
        }*/
        assert.equal(tmp.length, 1);
        tmp = await ds.read('star');
        assert.equal(tmp.length, 2);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Snippets');
        await ExtendedTestHelper.delay(1000);
        var panel = await sidemenu.getPanel();
        assert.notEqual(panel, null);
        var button = await panel.getButton('new');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var formEntry = await form.getFormEntry('model');
        assert.notEqual(formEntry, null);
        const xpath = './/div[contains(@class, "panel")]';
        var elements = await formEntry.findElements(webdriver.By.xpath(xpath));
        assert.equal(elements.length, 1);
        var p = new Panel(helper, elements[0]);
        await p.openContextMenu();
        await ExtendedTestHelper.delay(1000);

        const xPathSidePanel = '/html/body/div[@id="sidenav"]/div[@id="sidepanel"]';
        var sidepanel = await driver.findElement(webdriver.By.xpath(xPathSidePanel));
        assert.notEqual(sidepanel, null);
        var rect = await sidepanel.getRect();
        assert.notEqual(rect['width'], 0);

        await panel.getElement().click();
        const xpathContextMenu = `/html/body/ul[@class="contextmenu"]`;
        elements = await driver.findElements(webdriver.By.xpath(xpathContextMenu));
        assert.equal(elements.length, 0);

        var input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('alert');
        await ExtendedTestHelper.delay(1000);
        formEntry = await form.getFormEntry('snippet');
        assert.notEqual(formEntry, null);
        input = await formEntry.findElement(webdriver.By.xpath('./div[@class="value"]/textarea[@name="snippet"]'));
        assert.notEqual(input, null);
        await input.sendKeys('alert("Test");');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Save');
        assert.notEqual(button, null);
        await button.click();
        //await app.waitLoadingFinished(10);
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Saved successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        panel = await sidemenu.getPanel();
        assert.notEqual(panel, null);
        const xPathNode = './div/div[@class="tree"]/div[contains(@class, "treenode")]/div[contains(@class, "treegroup")]/div[@class="treenode"]';
        var nodes = await panel.getElement().findElements(webdriver.By.xpath(xPathNode));
        assert.equal(nodes.length, 1);
        await nodes[0].click();
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Test');
        await ExtendedTestHelper.delay(1000);
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        button = await panel.getButton('edit json');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var textarea = await panel.getElement().findElement(webdriver.By.xpath(`.//textarea`));
        assert.notEqual(textarea, null);
        await textarea.clear();
        await textarea.sendKeys('[]');
        button = await panel.getButton('Change');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        panel = await sidemenu.getPanel();
        assert.notEqual(panel, null);
        button = await panel.getButton('save');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Saved successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await sidemenu.close();
        sidepanel = await driver.findElement(webdriver.By.xpath(xPathSidePanel));
        assert.notEqual(sidepanel, null);
        rect = await sidepanel.getRect();
        assert.equal(rect['width'], 0);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Snippets');
        await ExtendedTestHelper.delay(1000);
        panel = await sidemenu.getPanel();
        assert.notEqual(panel, null);
        nodes = await panel.getElement().findElements(webdriver.By.xpath(xPathNode));
        assert.equal(nodes.length, 0);
        button = await panel.getButton('new');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('state_all');
        await ExtendedTestHelper.delay(1000);
        formEntry = await form.getFormEntry('snippet');
        assert.notEqual(formEntry, null);
        input = await formEntry.findElement(webdriver.By.xpath('./div[@class="value"]/textarea[@name="snippet"]'));
        assert.notEqual(input, null);
        var snippet = `const controller = app.getController();
try {
   controller.setLoadingState(true);
   const state = new State();
   state.typeString = 'star';
   controller.loadState(state, true);
} catch(error) {
   controller.setLoadingState(false);
   controller.showError(error);
}`;
        await input.sendKeys(snippet);
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Save');
        assert.notEqual(button, null);
        await button.click();
        //await app.waitLoadingFinished(10);
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Saved successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        panel = await sidemenu.getPanel();
        assert.notEqual(panel, null);
        nodes = await panel.getElement().findElements(webdriver.By.xpath(xPathNode));
        assert.equal(nodes.length, 1);
        await nodes[0].click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);
        sidepanel = await driver.findElement(webdriver.By.xpath(xPathSidePanel));
        assert.notEqual(sidepanel, null);
        rect = await sidepanel.getRect();
        assert.equal(rect['width'], 0);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 2);

        return Promise.resolve();
    });
});