const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    var data = {};

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
            "projects",
            "defects",
            "user-stories",
            "tasks"
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
    if (bUpdate)
        await registry.upsert('profiles', JSON.stringify(profiles));

    return Promise.resolve(data);
}

module.exports = { setup };