const path = require('path');

const HttpProxy = require(path.join(__dirname, './server/http-proxy.js'));

const proxy = new HttpProxy();

async function init() {
    proxy.init(controller);
    return Promise.resolve();
}

module.exports = { init, proxy, HttpProxy };