const path = require('path');
const fs = require('fs');

const ChatGpt = require('./server/chat-gpt.js');

let gpt;

const routePublic = {
    'regex': '^/chat-gpt/public/(.*)$',
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
    //await controller.getDependencyController().installDependencies(['socket.io']);

    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    const registry = controller.getRegistry();
    var config;
    var tmp = await registry.get('chatGptConfig');
    if (tmp)
        config = JSON.parse(tmp);
    gpt = new ChatGpt(ws, config);

    return Promise.resolve();
}

async function teardown() {
    /*if (gpt)
        gpt.teardown();*/

    const ws = controller.getWebServer(routePublic);
    ws.deleteExtensionRoute(routePublic);

    var p = './server/chat-gpt.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };