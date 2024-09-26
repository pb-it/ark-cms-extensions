const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const routePublic = {
    'regex': '^/state-bm/public/(.*)$',
    'fn': async function (req, res, next) {
        const file = req.locals['match'][1];
        const filePath = path.join(__dirname, 'public', file);
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
    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };