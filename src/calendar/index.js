const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const routePublic = {
    'regex': '^/calendar/public/(.*)$',
    'fn': async function (req, res, next) {
        const file = req.locals['match'][1];
        const filePath = path.join(__dirname, 'public', file);
        if (fs.existsSync(filePath))
            res.sendFile(filePath);
        else
            next();
        return Promise.resolve();
    }.bind(this)
};

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    const manifest = require(path.join(__dirname, 'manifest.json'));
    const version = 'calendar@' + manifest['version'];
    const shelf = controller.getShelf();
    var model = shelf.getModel('calendar');

    var definition;
    if (!model) {
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/calendar-entries.json'), 'utf8'));
        definition['version'] = version;
        model = await shelf.upsertModel(null, definition);
        await model.initTables(false);
        await model.initModel();
    }

    const profile = {
        "name": "calendar",
        "menu": [
            "Calendar",
            "calendar-entries"
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
                if (x['name'] === 'calendar') {
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

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);
    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };