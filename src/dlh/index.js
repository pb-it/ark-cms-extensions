const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const DownloadHelper = require(path.join(__dirname, './server/downloadhelper.js'));

var dlh;

const routePublic = {
    'regex': '^/dlh/public/(.*)$',
    'fn': async function (req, res, next) {
        var file = req.locals['match'][1];
        var filePath = path.join(__dirname, 'public', file);
        if (fs.existsSync(filePath))
            res.sendFile(filePath);
        else
            next();
        return Promise.resolve();
    }.bind(this)
};

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    dlh = new DownloadHelper();
    await dlh.init();

    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    var p = path.join(__dirname, './server/downloadhelper.js');
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown, DownloadHelper };