const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, './src/common/common.js'));
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const Download = require('./download.js');
const YtdlCore = require('./ytdl-core.js');
const YtDlpNative = require('./yt-dlp-native.js');

class DownloadHelper {

    static _instance;

    _dir;
    _version;
    _bNative;

    _clients;
    _ruleset;
    _downloads;

    constructor() {
        if (DownloadHelper._instance)
            return DownloadHelper._instance;
        DownloadHelper._instance = this;
    }

    async init() {
        this._clients = [];
        this._downloads = [];

        this._clients.push({
            name: 'ytdl-core',
            client: new YtdlCore()
        });
        this._clients.push({
            name: 'yt-dlp-native',
            client: new YtDlpNative()
        });

        const tmpDir = await controller.getTmpDir();
        const dir = path.join(tmpDir, 'dlh');
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
            fs.mkdirSync(dir, { recursive: true });
        this._dir = dir;

        if (os.type() === 'Linux' || os.type() === 'Darwin') {
            const cmd = 'yt-dlp --version';
            const response = await common.exec(cmd);
            if (response.length == 11)
                this._version = response.substring(0, 10);
        }

        const registry = controller.getRegistry();
        var config;
        var tmp = await registry.get('dlhConfig');
        if (tmp)
            config = JSON.parse(tmp);
        if (config)
            await this._applyConfig(config);

        this._addRoutes(tmpDir);

        return Promise.resolve();
    }

    async _applyConfig(config) {
        this._bNative = config['bNative'];
        if (config['funcRuleset']) {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            const funcRuleset = new AsyncFunction(config['funcRuleset']);
            this._ruleset = await funcRuleset();
        }
        return Promise.resolve();
    }

    _addRoutes(tmpDir) {
        const ws = controller.getWebServer();

        ws.addExtensionRoute({
            'regex': '^/dlh/info$',
            'fn': async function (req, res, next) {
                res.json({ 'version': this._version });
                return Promise.resolve();
            }.bind(this)
        });

        ws.addExtensionRoute({
            'regex': '^/dlh/configure$',
            'fn': async function (req, res, next) {
                const config = req.body;
                const registry = controller.getRegistry();
                await registry.upsert('dlhConfig', JSON.stringify(config));
                await this._applyConfig(config);

                //this._init();
                //controller.setRestartRequest();
                res.send('OK');
                return Promise.resolve();
            }.bind(this)
        });

        const app = ws.getApp();
        const rootPath = '/api/ext/dlh/download';

        app.get(rootPath, async (req, res) => {
            try {
                const arr = [];
                for (var x of this._downloads) {
                    arr.push(x.getData());
                }
                res.json(arr);
            } catch (error) {
                Logger.parseError(error);
                res.writeHead(503, 'System error');
                res.write(error);
                res.end();
            }
            return Promise.resolve();
        });

        app.get(rootPath + "/:uuid", async (req, res) => {
            try {
                var download;
                var tmp = this._downloads.filter(function (x) { return x.getId() == req.params.uuid });
                if (tmp && tmp.length == 1)
                    download = tmp[0];
                if (download) {
                    res.json(download.getData());
                } else {
                    res.status(404); // Not Found
                    res.send('Invalid ID');
                }
            } catch (error) {
                Logger.parseError(error);
                if (!res.headersSent) {
                    res.status(500); // Internal Server Error
                    if (error['message'])
                        res.send(error['message']);
                    else
                        res.send('An unexpected error has occurred');
                }
            }
            return Promise.resolve();
        });

        app.post(rootPath, async (req, res) => {
            try {
                var download;
                if (req.body && req.body['url'])
                    download = this._getDownload(req.body['url']);
                if (download) {
                    if (req.body['options'])
                        download.setOptions(req.body['options']);
                    this._downloads.push(download);
                    download.start();
                    res.json(download.getData());
                } else {
                    res.status(404); // Not Found
                    res.send('Invalid URL');
                }
            } catch (error) {
                Logger.parseError(error);
                if (!res.headersSent) {
                    res.status(500); // Internal Server Error
                    if (error['message'])
                        res.send(error['message']);
                    else
                        res.send('An unexpected error has occurred');
                }
            }
            return Promise.resolve();
        });

        ws.addExtensionRoute(
            {
                'regex': '^/dlh' + tmpDir + '/dlh/(.*)$',
                'fn': async function (req, res, next) {
                    var file = req.locals['match'][1];
                    //console.log(file);
                    var filePath = path.join(this._dir, file);
                    if (fs.existsSync(filePath))
                        res.sendFile(filePath);
                    else
                        next();
                    return Promise.resolve();
                }.bind(this)
            }
        );
    }

    _getDownload(url) {
        var download;
        var client;
        var options;
        if (this._ruleset) {
            var rule;
            var match;
            for (var r of this._ruleset) {
                match = new RegExp(r['regex'], 'ig').exec(url);
                if (match) {
                    rule = r;
                    break;
                }
            }
            if (rule) {
                client = this.getClient(rule['client']);
                options = rule['options'];
            }
        } else {
            if (this._bNative)
                client = new YtDlpNative();
            else {
                //client = new YtdlCore();
                throw new Error('\'node-ytdl-core\' is deprecated! Please install/use native client instead!');
            }
        }
        if (client) {
            const uid = crypto.randomBytes(16).toString('hex');
            const logfile = path.join(this._dir, uid + '.log');
            download = new Download(uid, url, this._dir, uid, client, options, logfile);
        }
        return download;
    }

    addClient(name, client) {
        this._clients.push({
            name: name,
            client: client
        });
    }

    getClient(name) {
        var client;
        var tmp = this._clients.filter(function (x) { return (x['name'] === name) });
        if (tmp.length == 1)
            client = tmp[0]['client'];
        return client;
    }
}

module.exports = DownloadHelper;