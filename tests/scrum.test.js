const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - scrum', function () {

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

        const ext = 'scrum';
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

    it('#test create items', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('scrum');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('tasks');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, null);
        var form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('TestTask');
        await ExtendedTestHelper.delay(100);

        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('scrum');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('defects');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, null);
        form = await window.getForm(panel);
        input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('TestDefect');
        await ExtendedTestHelper.delay(1000);
        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test kanban board', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var data = await ds.read('tasks');
        assert.equal(data.length, 1);
        const task = data[0];
        assert.equal(task['title'], 'TestTask');
        assert.equal(task['state'], undefined);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('scrum');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Kanban-Board');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        assert.notEqual(panel, null);

        const xpathBacklogColumn = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]/div/table[@class="kanban-board"]/tr[2]/td[1]/div[@class="kanban-board-column"]`
        const xpathBacklogItem = xpathBacklogColumn + `/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathBacklogItem));
        assert.equal(panels.length, 2);

        panel = panels[0];
        var text = await panel.getText();
        assert.equal(text, 'TestTask');

        const xpathOpenColumn = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]/div/table[@class="kanban-board"]/tr[2]/td[2]/div[@class="kanban-board-column"]`;
        const openColumn = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathOpenColumn }), 1000);
        assert.notEqual(openColumn, null);

        await driver.actions().dragAndDrop(panel, openColumn).perform();
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathBacklogItem));
        assert.equal(panels.length, 1);

        const xpathOpenItem = xpathOpenColumn + `/div[contains(@class, 'panel')]`;
        panels = await driver.findElements(webdriver.By.xpath(xpathOpenItem));
        assert.equal(panels.length, 1);

        data = await ds.read('tasks', task['id']);
        assert.equal(data['state'], 'open');

        const xpathDoneColumn = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]/div/table[@class="kanban-board"]/tr[2]/td[5]/div[@class="kanban-board-column"]`;
        const doneColumn = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathDoneColumn }), 1000);

        await driver.actions().dragAndDrop(panels[0], doneColumn).perform();
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathOpenItem));
        assert.equal(panels.length, 0);

        const xpathDoneItem = xpathDoneColumn + `/div[contains(@class, 'panel')]`;
        panels = await driver.findElements(webdriver.By.xpath(xpathDoneItem));
        assert.equal(panels.length, 1);

        data = await ds.read('tasks', task['id']);
        assert.equal(data['state'], 'closed');

        return Promise.resolve();
    });
});