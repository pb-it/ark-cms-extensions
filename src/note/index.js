const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const data = {};

    const shelf = controller.getShelf();
    var mNote = shelf.getModel('note');
    var definition;
    if (!mNote) {
        var p = path.join(__dirname, 'models/note.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mNote = await shelf.upsertModel(null, definition);
        await mNote.initModel();
    }

    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/note/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                var filePath = path.join(__dirname, 'public', file);
                if (fs.existsSync(filePath))
                    res.sendFile(filePath);
                else
                    next();
                return Promise.resolve();
            }.bind(this)
        }
    );
    return Promise.resolve();
}

module.exports = { setup, init };