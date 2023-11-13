const path = require('path');

//const assert = require('assert');

const config = require('./config.js');
const { TestSetup, TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

var driver;
var helper;

describe('Testsuit', function () {

    before('#setup', async function () {
        this.timeout(10000);
        driver = await new TestSetup(config).getDriver();
        helper = new TestHelper(driver);

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test add extension', async function () {
        this.timeout(30000);

        const extensions = ['mime-text', 'process', 'formatter', 'http-proxy', 'axios-webclient', 'scraper', 'console', 'chat'];
        var file;
        for (var ext of extensions) {
            file = path.resolve(__dirname, "../dist/" + ext + "@1.0.0.zip");
            await helper.addExtension(ext, file);
        }
        await helper.checkRestartRequest();

        return Promise.resolve();
    });
});