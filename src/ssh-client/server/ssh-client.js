const path = require('path');

const { Client } = require('ssh2');
const { Server } = require('socket.io');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

class SshClient {

    static _instance;

    _client;
    _params;
    _io;

    constructor() {
        if (SshClient._instance)
            return SshClient._instance;
        SshClient._instance = this;
    }

    init() {
        const ws = controller.getWebServer();
        const server = ws.getServer();
        this._io = this._initIo(server);
    }

    _initIo(server) {
        const rootPath = '/api/ext/ssh-client';
        const socketPath = rootPath + '/socket.io/';
        const options = {
            path: socketPath,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                //credentials: true
            },
            allowEIO3: true
        };
        const io = new Server(server, options);
        io.on('connection', (socket) => {
            const version = socket.conn.protocol;
            console.log('a user connected(version:' + version + ')');

            socket.on('param', async (param) => {
                //console.log(param);
                try {
                    await this.connect(param);
                    if (this._io)
                        this._io.emit('chat message', 'SSH: connected');
                } catch (error) {
                    Logger.parseError(error);
                    if (this._io)
                        this._io.emit('chat message', 'SSH: ' + error.toString());
                }
            });

            socket.on('chat message', (cmd) => {
                //io.emit('chat message', cmd);
                try {
                    this.execute(cmd);
                } catch (error) {
                    Logger.parseError(error);
                    if (this._io)
                        this._io.emit('chat message', 'SSH: ' + error.toString());
                }
            });

            socket.on('disconnect', () => {
                console.log('user disconnected');

                if (this._client) {
                    this._client.end();
                    this._client = null;
                    console.log('Command execution closed');
                }
            });
        });
        return io;
    }

    async connect(params) {
        if (this._client)
            this._client.end();
        this._client = new Client();
        this._params = params;
        return new Promise((resolve, reject) => {
            this._client.connect(this._params);
            this._client.on('ready', () => {
                console.log('Connected via SSH!');
                resolve();
            });
            this._client.on('error', (err) => {
                console.error('Error connecting via SSH:', err);
                reject(err);
            });
        });
    }

    async handle(req, res, next) {
        var param;
        var cmd;
        if (req.method == 'POST') {
            param = {};
            const body = req.body;
            param['host'] = body['host'];
            param['username'] = body['username'];
            param['password'] = body['password'];
            cmd = body['cmd'];
        }
        if (param && cmd) {
            try {
                await this.connect(param);
                this.execute(cmd);
                res.send('OK');
            } catch (error) {
                Logger.parseError(error);
                if (!res.headersSent) {
                    res.status(500);
                    if (error['message'])
                        res.send(error['message']);
                    else
                        res.send('System error');
                }
            }
        } else
            next();
        return Promise.resolve();
    }

    execute(command) {
        this._client.exec(command, (err, stream) => {
            if (err)
                throw err;

            stream.on('close', (code, signal) => {
                /*this._client.end();
                console.log('Command execution closed');*/
            })
                .on('data', (data) => {
                    console.log('Command output:', data.toString());
                    if (this._io)
                        this._io.emit('chat message', 'SSH: ' + data.toString());
                })
                .stderr.on('data', (data) => {
                    console.error('Command error:', data.toString());
                });
        });
    }
}

module.exports = SshClient;