const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    //await controller.getDependencyController().installDependencies(['socket.io']);

    const ws = controller.getWebServer();

    _initIo(ws.getServer());

    ws.addExtensionRoute(
        {
            'regex': '^/chat$',
            'fn': async function (req, res) {
                res.sendFile(path.join(__dirname, './public/index.html'));
                return Promise.resolve();
            }.bind(this)
        }
    );
    return Promise.resolve();
}

function _initIo(server) {
    const { Server } = require("socket.io");
    const io = new Server(server, {
        path: "/api/ext/chat/socket.io/" // -> /api/ext/chat/socket.io/socket.io.js
    });

    io.on('connection', (socket) => {
        //console.log('a user connected');
        socket.on('chat message', (msg) => {
            //console.log('message: ' + msg);
            io.emit('chat message', msg);
        });

        socket.on('disconnect', () => {
            ; //console.log('user disconnected');
        });
    });
}

module.exports = { setup, init };