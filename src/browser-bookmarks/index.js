const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const routePublic = {
    'regex': '^/browser-bookmarks/public/(.*)$',
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

    const shelf = controller.getShelf();
    var model = shelf.getModel('browser-bookmarks');
    if (!model) {
        var p = path.join(__dirname, 'models/browser-bookmarks.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        const definition = require(p);
        model = await shelf.upsertModel(null, definition);
        await model.initModel();
    }

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
    return Promise.resolve();
}

module.exports = { setup, init, teardown };