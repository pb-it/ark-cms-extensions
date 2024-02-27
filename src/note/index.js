const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    const shelf = controller.getShelf();
    var mNote = shelf.getModel('note');
    var definition;
    if (!mNote) {
        var p = path.join(__dirname, 'models/note.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mNote = await shelf.upsertModel(null, definition);
        await mNote.initModel();
    }

    const profile = {
        "name": "notes",
        "menu": [
            "Bulletin-Board",
            "note"
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
                if (x['name'] === 'notes') {
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

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/note/public/(.*)$',
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
    return Promise.resolve();
}

module.exports = { setup, init };