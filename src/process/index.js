const path = require('path');
//const { Worker } = require("worker_threads");

const ejs = require("ejs");
const { Server } = require("socket.io");

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, "./src/common/common.js"));
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const rootPath = '/api/ext/process';
const socketPath = rootPath + '/socket.io/';

var id = 0;
const JOBS = {};

const renderFile = (file, data) => {
    return new Promise((resolve, reject) => {
        ejs.renderFile(file, data, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}

class Process {

    _io;

    id;
    state;
    name;
    description;
    socket;
    result;

    constructor() {
        this.id = ++id;
        this.state = 'running';
    }

    getUrl() {
        return rootPath + '/' + this.id;
    }

    setSocket(url, io) {
        this.socket = url;
        this._io = io;
    }

    getSocket() {
        return this._io;
    }
}

class ProcessController {

    _io;

    constructor() {
        var ws = controller.getWebServer();
        var server = ws.getServer();
        var app = ws.getApp();

        this._io = this._initIo(server);
        this._addSocketRoute(ws);
        this._addProcessRoutes(app);
    }

    _initIo(server) {
        /*var config = controller.getServerConfig();
        var host = 'http';
        if (config.ssl)
            host += 's';
        host += '://localhost:' + config.port;*/
        var options = {
            /*cors: {
                origin: '*',
                //origin: [host, '...'],
                methods: ["GET", "POST"],
                credentials: true,
                transports: ['websocket', 'polling'],
            },*/
            path: socketPath,
            allowEIO3: true
        };

        var io = new Server(server, options);

        io.on('connection', (socket) => {
            var version = socket.conn.protocol;
            console.log('a user connected(version:' + version + ')');

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
        return io;
    }

    _addSocketRoute(ws) {
        ws.addExtensionRoute(
            {
                'regex': '^/process/socket$',
                'fn': async function (req, res) {
                    res.sendFile(path.join(__dirname, './public/index.html'));
                }
            }
        );
    }

    _addProcessRoutes(app) {
        app.get(rootPath, async (req, res) => {
            //res.sendFile(path.join(__dirname, './public/index.html'));

            try {
                var result = await renderFile(path.join(__dirname, './views/list.ejs'), { 'processes': [...Object.values(JOBS)] });
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                res.end(result);
            } catch (error) {
                Logger.parseError(error);
                res.writeHead(503, 'System error');
                res.write(error);
                res.end();
            }
            return Promise.resolve();
        });

        app.get(rootPath + "/:uuid", async (req, res) => {
            if (JOBS[req.params.uuid]) {
                var process = { ...JOBS[req.params.uuid] };
                if (process['result'])
                    process['result'] = common.encodeText(process['result']);
                var result = await renderFile(path.join(__dirname, './views/process.ejs'), { 'process': process });
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                res.end(result);
            } else {
                res.send("No valid process ID.");
            }
            return Promise.resolve();
        });
    }

    createProcess() {
        var process = new Process();
        process.setSocket(rootPath + '/socket', this._io);
        JOBS[process['id']] = process;
        return process;
    }
}

async function init() {
    var pc = new ProcessController();
    global.processController = pc;
    return Promise.resolve();
}


module.exports = { init };