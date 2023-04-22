const path = require('path');
const fs = require('fs');
//const { Worker } = require("worker_threads");

const ejs = require("ejs");
const { Server } = require("socket.io");

const Process = require(path.join(__dirname, "./process.js"));

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, "./src/common/common.js"));
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const rootPath = '/api/ext/process';
const socketPath = rootPath + '/socket.io/';

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

class ProcessController {

    _logsDir;
    _io;

    constructor() {
        var ws = controller.getWebServer();
        var server = ws.getServer();
        var app = ws.getApp();

        this._logsDir = path.join(__dirname, "logs");
        if (fs.existsSync(this._logsDir) && fs.statSync(this._logsDir).isDirectory())
            fs.rmSync(this._logsDir, { recursive: true, force: true });
        fs.mkdirSync(this._logsDir);

        this._io = this._initIo(server);
        this._addSocketRoute(ws);
        this._addLogsRoute(ws);
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

    _addLogsRoute(ws) {
        ws.addExtensionRoute(
            {
                'regex': '^/process/logs/(.*)$',
                'fn': async function (req, res) {
                    var file = req.locals['match'][1];
                    var filePath = path.join(__dirname, 'logs', file);
                    if (fs.existsSync(filePath))
                        res.sendFile(filePath);
                    else
                        next();
                    return Promise.resolve();
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
            var orig = JOBS[req.params.uuid];
            if (orig) {
                var process = { ...orig };
                process['socket'] = orig.getSocketUrl();
                if (fs.existsSync(orig.getLogfile()))
                    process['logfile'] = orig.getLogfileUrl();
                if (orig['result'])
                    process['result'] = common.encodeText(orig['result']);
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
        var id = process['id'];
        process.setSocket(this._io, rootPath + '/socket');
        var logfile = process['id'] + '.txt';
        process.setLogfile(path.join(this._logsDir, logfile), rootPath + '/logs/' + logfile);
        JOBS[id] = process;
        return process;
    }
}

module.exports = ProcessController;