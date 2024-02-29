const path = require('path');
const fs = require('fs');

/*const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));*/

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {

    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/table/public/(.*)$',
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

    const dtc = controller.getDataTypeController();
    const table = {
        'tag': 'table',
        'add': function (model, table, attribute) {
            var attr = { ...attribute };
            attr['dataType'] = 'text';
            model._addColumn(table, attr);
            return;
        }
    }
    dtc.addDataType(table);

    return Promise.resolve();
}

module.exports = { setup, init };