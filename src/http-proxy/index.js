const path = require('path');

var HttpProxy;

async function init() {
    var sPath = path.join(__dirname, './server/http-proxy.js');
    var resolved;
    resolved = require.resolve(sPath);
    if (resolved)
        delete require.cache[resolved];
    HttpProxy = require(sPath);

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