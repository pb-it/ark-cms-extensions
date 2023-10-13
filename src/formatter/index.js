const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    return Promise.resolve();
}

module.exports = { setup, init };