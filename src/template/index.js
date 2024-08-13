const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const Template = require('./server/template.js');

const routePublic = {
    'regex': '^/template/public/(.*)$',
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

    const manifest = require(path.join(__dirname, 'manifest.json'));
    const version = 'template@' + manifest['version'];
    const shelf = controller.getShelf();
    var model = shelf.getModel('template');

    var definition;
    if (!model) {
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/template.json'), 'utf8'));
        definition['version'] = version;
        model = await shelf.upsertModel(null, definition);
        await model.initTables(false);
        await model.initModel();
    }

    // add model to profile

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);
    Template.initRoutes(ws);

    const dtc = controller.getDataTypeController();
    const dt = {
        'tag': 'template',
        'add': function (model, table, attribute) {
            //Logger.info(JSON.stringify(attribute));
            const attr = { ...attribute };
            attr['dataType'] = 'string';
            model._addColumn(table, attr);
            return;
        },
        'createForge': async function (attr, data, old, forge) {
            const str = attr['name'];
            if (data[str])
                forge[str] = data[str];
            return Promise.resolve();
        },
        /*'destroy': async function (attr, data, value) {
            return Promise.resolve(); // delete files, etc.
        }*/
    }
    dtc.addDataType(dt);

    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    /*var p = './server/test-helper.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];*/

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown, Template };