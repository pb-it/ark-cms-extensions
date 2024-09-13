const path = require('path');
const fs = require('fs');

const SshClient = require("./server/ssh-client.js");

const routePublic = {
    'regex': '^/ssh-client/public/(.*)$',
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
    const client = new SshClient();
    client.init();

    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    ws.addExtensionRoute(
        {
            'regex': '^/ssh-client/execute$',
            'fn': client.handle.bind(client)
        }
    );
    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };