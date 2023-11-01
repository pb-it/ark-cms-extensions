const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');
//const remote = require('selenium-webdriver/remote');

const config = require('./config.js');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

var driver;
var helper;

describe('Testsuit', function () {
    before('description', async function () {
        this.timeout(10000);
        driver = await new TestSetup(config).getDriver();
        helper = new TestHelper(driver);

        await TestHelper.delay(1000);
    });

    it('#test add extension', async function () {
        this.timeout(10000);

        var ext = 'scraper';

        //driver.setFileDetector(new remote.FileDetector());

        // https://copyprogramming.com/howto/selenium-close-file-picker-dialog
        driver.executeScript(function () {
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

        await TestHelper.delay(1000);

        try {
            var tmp = await driver.switchTo().alert();
            if (tmp)
                await tmp.dismiss();
        } catch (error) {
            ;
        }

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Extensions"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"${ext}")]`;
        var tmp = await driver.findElements(webdriver.By.xpath(xpath));
        var bExists = (tmp.length > 0);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"Add")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await TestHelper.delay(1000);

        xpath = `//input[@type="file"]`;
        var input = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        if (input) {
            var absolutePath = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
            input.sendKeys(absolutePath);

            var alert;
            if (bExists) {
                await driver.wait(webdriver.until.alertIsPresent());
                alert = await driver.switchTo().alert();
                await alert.accept();
            }

            await driver.wait(webdriver.until.alertIsPresent());
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text.startsWith('Uploaded \'' + ext + '\' successfully!'), true);
            await alert.accept();
        } else
            assert.fail("Input not found");

        await driver.navigate().refresh();
        await TestHelper.delay(100);

        return Promise.resolve();
    });

    it('#test scraper', async function () {
        this.timeout(30000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const func = async function (url, doc, data) {
                if (!data)
                    data = {};
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
            const formatter = app.getController().getFormatter();
            var str = await formatter.formatText(func.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].trim(), 'javascript');

            const ac = app.getController().getApiController();
            const client = ac.getApiClient();
            var tmp = await client.requestData('GET', 'scraper?domain=www.finanzen.at');

            if (!tmp || tmp.length == 0) {
                var data = {
                    'domain': 'www.finanzen.at',
                    'funcScrape': str
                };
                var obj = new CrudObject('scraper', data);
                tmp = await obj.create();
            } else if (tmp && tmp.length == 1) {
                if (tmp[0]['funcScrape'] != str) {
                    var obj = new CrudObject('scraper', tmp[0]);
                    tmp = await obj.update({ 'funcScrape': str });
                }
            }

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            var res = await Scraper.scrape(url);
            callback(res);
        });
        var expect = JSON.stringify({
            'name': 'NVIDIA'
        });
        assert.equal(JSON.stringify(response), expect);

        //edit-modal
        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const url = 'https://www.finanzen.at/aktien/nvidia-aktie';
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                var rule = await Scraper._getRule(url);
                if (rule) {
                    var obj = new CrudObject('scraper', rule);
                    var body = await HttpProxy.request(url);
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(body, 'text/html');

                    controller.setLoadingState(false);
                    //res = await Scraper.openEditScraperModal(rule, url, body, doc);
                    Scraper.openEditScraperModal(obj, url, body, doc);
                } else
                    throw new Error('No matching rule found!');
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            callback();
        });

        modal = await helper.getTopModal();
        assert.equal(modal != null, true);

        return Promise.resolve();
    });
});