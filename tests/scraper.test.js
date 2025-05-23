const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - scraper', function () {

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

        const ext = 'scraper';
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

    it('#test scraper', async function () {
        this.timeout(30000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.net/aktien/nvidia-aktie';

            const funcScrape = async function (url, doc, data) {
                var data = {};
                var title = doc.querySelector("meta[property='og:title']").getAttribute("content");
                var index = title.toLowerCase().indexOf('aktie');
                if (index > 0)
                    data['name'] = title.substring(0, index - 1);
                else
                    data['name'] = title;
                var badge = doc.querySelectorAll("div.badge-bar > h2.badge");
                if (badge) {
                    var txt;
                    var val;
                    var children;
                    for (var i = 0; i < badge.length; i++) {
                        children = badge[i].children;
                        if (children.length >= 2) {
                            txt = children[0].innerText;
                            val = children[1].innerText;
                            if (txt === "WKN") data['wkn'] = val;
                            else if (txt === "ISIN") data['isin'] = val;
                            else if (txt === "Symbol") data['symbol'] = val;
                        }
                    }
                }
                return Promise.resolve(data);
            };
            const controller = app.getController();
            const formatter = controller.getFormatter();
            var str = await formatter.formatText(funcScrape.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].trim(), 'javascript');

            var rule = await Scraper.getRule(url);
            if (!rule || rule.length == 0) {
                const options = {
                    'headers': {
                        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0'
                    }
                };
                const data = {
                    'domain': 'www.finanzen.net',
                    'options': options,
                    'funcScrape': str
                };
                const obj = new CrudObject('scraper', data);
                rule = await obj.create();
            } else if (rule && rule.length == 1) {
                if (rule[0]['funcScrape'] != str) {
                    const obj = new CrudObject('scraper', rule[0]);
                    rule = await obj.update({ 'funcScrape': str });
                }
            }

            const res = await Scraper.scrape(url);
            callback(res);
        });
        var expect = JSON.stringify({
            'isin': 'US67066G1040',
            'name': 'NVIDIA',
            'symbol': 'NVDA',
            'wkn': '918422'
        });
        assert.equal(JSON.stringify(response), expect);

        return Promise.resolve();
    });

    it('#test scraper route', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        await app.navigate('/scraper');
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('url');
        assert.notEqual(input, null);
        await input.sendKeys('https://www.finanzen.net/aktien/nvidia-aktie');
        await ExtendedTestHelper.delay(1000);

        var button = await panel.getButton('Load Scraper');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        button = await panel.getButton('Curl');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        button = await panel.getButton('Test');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        var forms = await panel.getElement().findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 4);
        form = new Form(helper, forms[3]);

        input = await form.getFormInput('result');
        assert.notEqual(input, null);
        var result = await input.getAttribute('value');
        assert.equal(result, '{\n\t"name": "NVIDIA",\n\t"wkn": "918422",\n\t"isin": "US67066G1040",\n\t"symbol": "NVDA"\n}');

        return Promise.resolve();
    });
});