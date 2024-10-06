const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    const manifest = require(path.join(__dirname, 'manifest.json'));
    const version = 'snippets@' + manifest['version'];
    const shelf = controller.getShelf();
    var model = shelf.getModel('snippets');
    var definition;
    if (!model) {
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/snippets.json'), 'utf8'));
        definition['version'] = version;
        model = await shelf.upsertModel(null, definition);
        await model.initTables(false);
        await model.initModel();
    }

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    //ws.getApp().use('/api/ext/snippets/public', express.static(path.join(__dirname, 'public'), { fallthrough: false }));
    ws.addExtensionRoute(
        {
            'regex': '^/snippets/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                //console.log(file);
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