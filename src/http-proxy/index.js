const path = require('path');
const fs = require('fs');

var HttpProxy;

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    _update();
    await _createModels();

    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/http-proxy/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                //console.log(file);
                var filePath = path.join(__dirname, 'public', file);
                if (fs.existsSync(filePath))
                    res.sendFile(filePath);
                else
                    next();
                return Promise.resolve();
            }.bind(this)
        }
    );

    ws.addExtensionRoute(
        {
            'regex': '^/http-proxy/forward$',
            'fn': HttpProxy.forward
        }
    );
    return Promise.resolve();
}

function _update() {
    var sPath = path.join(__dirname, './server/http-proxy.js');
    var resolved;
    resolved = require.resolve(sPath);
    if (resolved)
        delete require.cache[resolved];
    HttpProxy = require(sPath);
}

async function _createModels() {
    const shelf = controller.getShelf();
    var model = shelf.getModel('http-proxy-cache');
    if (!model) {
        var p = path.join(__dirname, 'models/http-proxy-cache.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        var definition = require(p);
        model = await shelf.upsertModel(null, definition);
        await model.initModel();
    }
    if (model) {
        var profile = {
            "name": "http-proxy",
            "menu": [
                "http-proxy-cache"
            ]
        };

        var profiles;
        var bUpdate;
        const registry = controller.getRegistry();
        var str = await registry.get('profiles');
        if (str) {
            profiles = JSON.parse(str);
            if (profiles['available']) {
                var bFound;
                for (var x of profiles['available']) {
                    if (x['name'] === 'http-proxy') {
                        bFound = true;
                        break;
                    }
                }
                if (!bFound) {
                    profiles['available'].push(profile);
                    bUpdate = true;
                }
            }
        } else {
            profiles = {
                "available": [profile]
            };
            bUpdate = true;
        }
        if (bUpdate)
            await registry.upsert('profiles', JSON.stringify(profiles));
    }
    return Promise.resolve();
}

module.exports = { setup, init, HttpProxy };