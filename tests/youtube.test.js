const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Youtube', function () {

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

        const ext = 'youtube';
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

    it('#test download', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ac = app.getApiController();
        const tools = ac.getTools();
        const cmd = `async function test() {
    const path = require('path');
    const appRoot = controller.getAppRoot();
    const Youtube = require(path.join(appRoot, './extensions/youtube/server/youtube.js'));

    const yt = new Youtube('blA7epJJaR4');
    await yt.init();
    const title = yt.getTitle();

    return Promise.resolve(title);
};
module.exports = test;`
        const res = await tools.serverEval(cmd);
        assert.equal(res, 'Tobu - Higher');

        return Promise.resolve();
    });

    it('#test create video', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('youtube');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('youtube');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        const xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'youtube_id');
        assert.notEqual(input, null);
        await input.sendKeys('blA7epJJaR4');
        await ExtendedTestHelper.delay(100);
        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();

        const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
        var display = await overlay.getCssValue('display');
        if (display == 'none')
            await ExtendedTestHelper.delay(1000);

        var i = 0;
        while (display == 'block' && i < 30) {
            await ExtendedTestHelper.delay(1000);
            display = await overlay.getCssValue('display');
            i++;
        }
        assert.equal(await overlay.getCssValue('display'), 'none');

        const url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/youtube/1');

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test create playlist', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('youtube');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('playlist');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        const xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('Playlist');
        await ExtendedTestHelper.delay(100);
        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();

        const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
        var display = await overlay.getCssValue('display');
        if (display == 'none')
            await ExtendedTestHelper.delay(1000);

        var i = 0;
        while (display == 'block' && i < 10) {
            await ExtendedTestHelper.delay(1000);
            display = await overlay.getCssValue('display');
            i++;
        }

        await ExtendedTestHelper.delay(1000);

        const url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/playlist/1');

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test add to playlist', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/data/playlist/1');
        await ExtendedTestHelper.delay(1000);
        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var response = await driver.executeAsyncScript(async (panel, url) => {
            const callback = arguments[arguments.length - 1];

            var dropEvent = document.createEvent("CustomEvent");
            dropEvent.initCustomEvent('drop', true, true, null);
            dropEvent.dataTransfer = {
                data: {
                },
                setData: function (type, val) {
                    this.data[type] = val;
                },
                getData: function (type) {
                    return this.data[type];
                }
            };
            dropEvent.dataTransfer.setData('text/plain', url);
            panel.dispatchEvent(dropEvent);

            callback('OK');
        }, panels[0], config['host'] + '/data/youtube/1');
        assert.equal(response, 'OK', "DropEvent Failed!");

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Save"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await ExtendedTestHelper.delay(1000);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        await driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Details"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        modal = await window.getTopModal();
        xpath = `//div[text()="list:"]/following-sibling::div`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        var text = await item.getText();
        assert.equal(text, '1');

        await modal.closeModal();

        return Promise.resolve();
    });

    it('#test delete extension', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Extensions');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('youtube');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Delete extension \'youtube\'?');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent());
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Deleted extension successfully!\nReload website for the changes to take effect!');
        await alert.accept();

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});