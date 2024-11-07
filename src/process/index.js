const path = require('path');
const fs = require('fs');

const ProcessController = require(path.join(__dirname, "./process-controller.js"));

var processController;

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

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

module.exports = { setup, init, teardown, getProcessController };