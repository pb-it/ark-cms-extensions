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
            const attr = { ...attribute };
            const format = attr['format'];
            if (!format || format === 'html')
                attr['dataType'] = 'text';
            else if (format === 'json')
                attr['dataType'] = 'json';
            model._addColumn(table, attr);
            return;
        },
        'createForge': async function (attr, data, old, forge) {
            const name = attr['name'];
            const value = data[name];
            if (value) {
                const format = attr['format'];
                if (!format || format === 'html')
                    forge[name] = data[name];
                else if (format === 'json')
                    forge[name] = JSON.stringify(data[name]);
            }
            return Promise.resolve();
        }
    }
    dtc.addDataType(table);

    return Promise.resolve();
}

module.exports = { setup, init };