const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/editorjs/public/(.*)$',
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
    const mimeText = {
        'tag': 'editor.js',
        'add': function (model, table, attribute) {
            attr = { ...attribute };
            attr['dataType'] = 'text';
            model._addColumn(table, attr);
            return;
        }
    }
    dtc.addDataType(mimeText);

    return Promise.resolve();
}

module.exports = { setup, init };