const path = require('path');
const fs = require('fs');

async function _migrate() {
    const shelf = controller.getShelf();
    const models = shelf.getModel();
    if (models && models.length > 0) {
        var definition;
        for (var m of models) {
            definition = m.getDefinition();
            if (definition.hasOwnProperty('extensions') && definition['extensions'].hasOwnProperty('dashboard')) {
                if (definition.hasOwnProperty('_ext'))
                    definition['_ext']['dashboard'] = definition['extensions']['dashboard'];
                else
                    definition['_ext'] = {
                        'dashboard': definition['extensions']['dashboard']
                    }
                delete definition['extensions']['dashboard'];
                if (Object.keys(definition['extensions']).length == 0)
                    delete definition['extensions'];
                await shelf.upsertModel(undefined, definition);
            }
        }
    }
    return Promise.resolve();
}

const publicRoute = {
    'regex': '^/dashboard/public/(.*)$',
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
    await _migrate();

    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(publicRoute);
    return Promise.resolve();
}

module.exports = { setup, init };