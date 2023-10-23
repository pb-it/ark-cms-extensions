const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const dtc = controller.getDataTypeController();
    const mimeEnum = {
        'tag': 'mime-enum',
        'add': function (model, table, attribute) {
            attr = { ...attribute };
            attr['dataType'] = 'enumeration';
            attr['view'] = 'select';
            attr['bUseString'] = 'true';
            model._addColumn(table, attr);
            return;
        }
    }
    dtc.addDataType(mimeEnum);

    return Promise.resolve();
}

module.exports = { setup, init };