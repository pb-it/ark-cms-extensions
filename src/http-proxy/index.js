const path = require('path');

const HttpProxy = require(path.join(__dirname, './server/http-proxy.js'));

async function init() {
    var ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/http-proxy/forward$',
            'fn': HttpProxy.forward
        }
    );
    return Promise.resolve();
}

module.exports = { init, HttpProxy };