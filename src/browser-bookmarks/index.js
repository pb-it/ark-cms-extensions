const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const data = {};

    const shelf = controller.getShelf();
    var model = shelf.getModel('browser-bookmarks');
    if (!model) {
        var p = path.join(__dirname, 'models/browser-bookmarks.js');
        var resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        const definition = require(p);
        model = await shelf.upsertModel(null, definition);
        await model.initModel();
    }

    return Promise.resolve(data);
}

module.exports = { setup };