const path = require('path');

const assert = require('assert');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - scraper', function () {

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

        await app.prepare(config['api'], config['username'], config['password']);

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
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
        const file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");

        await helper.getExtensionController().addExtension(ext, file, true);

        const app = helper.getApp();
        await app.reload();

        await TestHelper.delay(1000);

        await app.login();

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
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

        //edit-modal
        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.net/aktien/nvidia-aktie';
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                const rule = await Scraper.getRule(url);
                if (rule) {
                    const obj = new CrudObject('scraper', rule);
                    const body = await HttpProxy.request(url, rule['options']);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(body, 'text/html');

                    controller.setLoadingState(false);
                    await Scraper.openEditScraperModal(url, body, doc, obj);
                } else
                    throw new Error('No matching rule found!');
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            callback();
        });

        const app = helper.getApp();
        modal = await app.getTopModal();
        assert.notEqual(modal, null);

        await modal.closeModal();

        modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});