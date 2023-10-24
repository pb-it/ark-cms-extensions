const path = require('path');

const ProcessController = require(path.join(__dirname, "./process-controller.js"));

var processController;

async function init() {
    processController = new ProcessController(); // global.processController = processController;
    return Promise.resolve();
}

async function teardown() {
    controller.setRestartRequest();
    return Promise.resolve();
}

function getProcessController() {
    return processController;
}

module.exports = { init, teardown, getProcessController };