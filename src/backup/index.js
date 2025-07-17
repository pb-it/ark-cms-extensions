const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const Backup = require('./server/backup.js');

/*const routePublic = {
    'regex': '^/backup/public/(.*)$',
    'fn': async function (req, res, next) {
        const file = req.locals['match'][1];
        const filePath = path.join(__dirname, 'public', file);
        if (fs.existsSync(filePath))
            res.sendFile(filePath);
        else
            next();
        return Promise.resolve();
    }.bind(this)
};*/

async function setup() {
    const data = {};
    if (controller.getDatabaseController().getDatabaseSettings()['client'].startsWith('mysql')) {
        data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

        const manifest = require(path.join(__dirname, 'manifest.json'));
        const version = 'backup@' + manifest['version'];
        const shelf = controller.getShelf();
        var model = shelf.getModel('backup');

        var definition;
        if (!model) {
            //definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/backup.json'), 'utf8'));
            var p = path.join(__dirname, 'models/backup.js');
            var resolved = require.resolve(p);
            if (resolved)
                delete require.cache[resolved];
            definition = require(p);
            definition['version'] = version;
            model = await shelf.upsertModel(null, definition);
            await model.initTables(false);
            await model.initModel();
        }

        const profile = {
            "name": "backup",
            "menu": [
                "backup"
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
                    if (x['name'] === 'backup') {
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
    } else
        throw new Error("By now only MySQL databases supported!");
    return Promise.resolve(data);
}

async function init() {
    const model = controller.getShelf().getModel('backup');
    if (model) {
        const attr = model.getAttribute('file');
        const localPath = controller.getFileStorageController().getPathForFile(attr);
        const dir = path.join(localPath, 'backup');
        if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory()))
            fs.mkdirSync(dir, { recursive: true });

        /*var attr;
        const definition = contentsModel.getDefinition();
        var tmp = definition['attributes'].filter(function (x) { return x['name'] === 'file' });
        if (tmp.length == 1)
            attr = tmp[0];*/
        if (attr) {
            /*attr['funcFileName'] = async function (data) {
                var fileName;
                var uid = data['uid'];
                fileName = path.join('backup', `${uid}.sql`);
                return Promise.resolve(fileName);
            };*/
        }

        model.setPreCreateHook(async function (data) {
            return Backup.create(data);
        });
        /*model.setPreUpdateHook(async function (oldData, newData) {
            return Promise.resolve(newData);
        });*/
    }

    const ws = controller.getWebServer();
    //ws.addExtensionRoute(routePublic);

    ws.addCustomDataRoute(
        {
            'regex': '^/backup/(\\d+)/restore$', // /api/data/v1/backup/<id>/restore
            'fn': async function (req, res) {
                try {
                    const model = controller.getShelf().getModel('backup');
                    if (model) {
                        const id = req.locals['match'][1];
                        const x = await model.read(id);
                        if (x && x['file']) {
                            await Backup.restore(x);
                        } else
                            throw new Error("Restoring backup failed!");
                    }
                    res.send('OK');
                } catch (error) {
                    Logger.parseError(error);
                    res.status(500);
                    res.send("Something went wrong!");
                }
                return Promise.resolve();
            }
        }
    );

    return Promise.resolve();
}

async function teardown() {
    /*const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);*/

    var p = './server/backup.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };