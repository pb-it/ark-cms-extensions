const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, "./src/common/common.js"));
const base64 = require(path.join(appRoot, "./src/common/base64.js"));

const HttpProxy = require("./server/http-proxy.js");

async function setup() {
    await _createModels();
    const data = { 'client-extension': fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8') };
    return Promise.resolve(data);
}

async function init() {
    const cacheModel = controller.getShelf().getModel('http-proxy-cache');
    if (cacheModel) {
        const definition = cacheModel.getDefinition();
        const attr = definition['attributes'].filter(function (x) { return x['name'] === 'file' });
        if (attr.length == 1) {
            attr[0]['funcFileName'] = async function (data) {
                var fileName;
                const fdata = data['file'];
                if (fdata) {
                    const uid = crypto.randomBytes(16).toString('hex');
                    var ext;
                    if (fdata['url'] || fdata['base64']) {
                        if (fdata['filename'])
                            ext = fdata['filename'].substring(fdata['filename'].lastIndexOf('.') + 1);
                        if (!ext && fdata['url'])
                            ext = common.getFileExtensionFromUrl(fdata['url']);
                        if (!ext && fdata['base64'])
                            ext = base64.getFileExtension(fdata['base64']);
                    }
                    fileName = `${cacheModel.getName()}/${new Date().getFullYear().toString()}/${uid}.${ext}`;
                }
                return Promise.resolve(fileName);
            };
        }
    }

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

async function teardown() {
    controller.setRestartRequest();
    return Promise.resolve();
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
        const file2 = controller.getExtensionController().getExtension('file2');
        if (file2) {
            definition['attributes'].push({
                "name": "file",
                "dataType": "file2",
                "storage": "filesystem",
                "cdn": "/cdn",
                "length": "250",
                "unique": true,
                "url_prop": "url",
                "bCustomFilename": false
            });
        }
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
        var bPrefix;
        const registry = controller.getRegistry();
        var str = await registry.get('profiles');
        if (str) {
            if (str.startsWith('data:text/javascript;charset=utf-8,')) {
                str = str.substring('data:text/javascript;charset=utf-8,'.length);
                bPrefix = true;
            }
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
        if (bUpdate) {
            if (bPrefix)
                str = 'data:text/javascript;charset=utf-8,' + JSON.stringify(profiles, null, '\t');
            else
                str = JSON.stringify(profiles);
            await registry.upsert('profiles', str);
        }
    }
    return Promise.resolve();
}

module.exports = { setup, init, teardown, HttpProxy };