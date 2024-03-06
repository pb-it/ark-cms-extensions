const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - File2', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.resetLocalStorage();
        await app.prepare(config['api'], config['username'], config['password']);

        await TestHelper.delay(1000);

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
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        const app = helper.getApp();
        await app.getExtensionController().addExtension(ext, file, true);

        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const window = app.getWindow();
        const modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test add model', async function () {
        this.timeout(60000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/file2.json'), 'utf8');
        const model = JSON.parse(str);
        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);
        console.log(id);

        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

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
        await ds.create('file2', data);

        return Promise.resolve();
    });

    it('#test create file', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await TestHelper.delay(1000);
        }
        await sidemenu.click('file2');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        const xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('bbb');
        await TestHelper.delay(100);
        const inputs = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        console.log(inputs.length);
        if (inputs && inputs.length == 8)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://www.w3schools.com/html/mov_bbb.mp4');
        await TestHelper.delay(1000);
        input = inputs[5];
        if (await input.getAttribute('readonly')) {
            await input.clear();
            await TestHelper.delay(1000);
        }

        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });
});