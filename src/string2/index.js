const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const routePublic = {
    'regex': '^/string2/public/(.*)$',
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
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    const dtc = controller.getDataTypeController();
    const dt = {
        'tag': 'string2',
        'add': function (model, table, attribute) {
            //Logger.info(JSON.stringify(attribute));
            const attr = { ...attribute };
            attr['dataType'] = 'string'; // override 'string2'
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

    /*var p = './index.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];*/

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };