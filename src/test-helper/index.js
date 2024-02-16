//const path = require('path');
//const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const TestHelper = require('./server/test-helper.js');

async function init() {
    const ws = controller.getWebServer();
    TestHelper.initRoutes(ws);
    return Promise.resolve();
}

async function teardown() {
    /*var p = './server/test-helper.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];*/

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { init, teardown };