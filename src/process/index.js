const path = require('path');

const ProcessController = require(path.join(__dirname, "./process-controller.js"));

var processController = new ProcessController();
//global.processController = processController;

async function init() {
    return Promise.resolve();
}


module.exports = { init, processController };