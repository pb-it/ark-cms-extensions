const path = require('path');
const fs = require('fs');

const routePublic = {
    'regex': '^/scraper/public/(.*)$',
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
    await _createModels();

    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function _createModels() {
    const shelf = controller.getShelf();
    var model = shelf.getModel('scraper');
    if (!model) {
        var p = path.join(__dirname, 'models/scraper.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        var definition = require(p);
        model = await shelf.upsertModel(null, definition);
        await model.initModel();
    }
    return Promise.resolve();
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