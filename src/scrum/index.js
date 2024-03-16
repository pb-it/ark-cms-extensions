const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    const shelf = controller.getShelf();
    var mProject = shelf.getModel('projects');
    var mUserStories = shelf.getModel('user-stories');
    var mTasks = shelf.getModel('tasks');
    var mDefects = shelf.getModel('defects');

    var definition;
    if (!mProject && !mUserStories && !mTasks && !mDefects) {
        var p = path.join(__dirname, 'models/projects.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mProject = await shelf.upsertModel(null, definition);
        await mProject.initModel();
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/user-stories.json'), 'utf8'));
        mUserStories = await shelf.upsertModel(null, definition);
        await mUserStories.initModel();
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/tasks.json'), 'utf8'));
        mTasks = await shelf.upsertModel(null, definition);
        await mTasks.initModel();
        definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'models/defects.json'), 'utf8'));
        mDefects = await shelf.upsertModel(null, definition);
        await mDefects.initModel();
    }

    var profile = {
        "name": "scrum",
        "menu": [
            "Kanban-Board",
            "projects",
            "defects",
            "user-stories",
            "tasks"
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
                if (x['name'] === 'scrum') {
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
    ws.addExtensionRoute(
        {
            'regex': '^/scrum/public/(.*)$',
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