const debug = require('debug');
const log = debug('app:webclient');
const path = require('path');
const fs = require('fs');
const https = require('https');
const axios = require('axios');
//const { stringify } = require('flatted');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const appRoot = controller.getAppRoot();
const WebClient = require(path.join(appRoot, './src/common/webclient/webclient.js'));
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));
const base64 = require(path.join(appRoot, './src/common/base64.js'));

class AxiosWebClient extends WebClient {

    static _parseResponse(response) {
        const res = {};
        res['status'] = response.status;
        res['statusText'] = response.statusText;
        res['url'] = response.config.url;
        res['headers'] = response.headers;
        //res['redirected'] = response.redirected;
        //res['type'] = response.type;
        res['body'] = response.data;
        return res;
    }

    static _progress(progressEvent) {
        const total = parseFloat(progressEvent.currentTarget.responseHeaders['Content-Length'])
        const current = progressEvent.currentTarget.response.length

        let percentCompleted = Math.floor(current / total * 100);
        console.log('completed: ', percentCompleted);
    }

    _ax;
    _debugOptions;

    constructor(config) {
        super('axios');
        if (!config) {
            config = {
                headers: {
                    common: {
                        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/109.0'
                    }
                },
                withCredentials: true
            }
        }
        this._ax = axios.create(config);

        this._debugOptions = {};
        const debugConfig = controller.getServerConfig()['debug'];
        if (debugConfig) {
            if (debugConfig['download'])
                this._debugOptions['download'] = true;

            if (debugConfig['axios']) {
                this.setDebugOption('request');
            }
        }
        if (debug.enabled('app:webclient') && !this._debugOptions['request'])
            this.setDebugOption('request');
    }

    setDebugOption(name, value = true) {
        if (this._debugOptions[name] != value) {
            this._debugOptions[name] = value;
            if (name === 'request') {
                if (value) {
                    this._ax.interceptors.request.use(request => {
                        //console.log('request', JSON.stringify(request, null, 2));
                        Logger.info('[webclient(axios)] request:\n' + JSON.stringify(request, null, '\t'));
                        return request;
                    }, error => {
                        Logger.info('[webclient(axios)] error:\n' + JSON.stringify(error, null, '\t'));
                        return request;
                    });
                }
            } else if (name === 'response') {
                if (value) {
                    this._ax.interceptors.response.use(response => {
                        Logger.info('[webclient(axios)] response:\n' + JSON.stringify(response, null, '\t'));
                        return request;
                    }, error => {
                        Logger.info('[webclient(axios)] error:\n' + JSON.stringify(error, null, '\t'));
                        return request;
                    });
                }
            }
        }
    }

    getAxios() {
        return this._ax;
    }

    async get(url, options) {
        return this.request(url, 'GET', null, options);
    }

    async post(url, data, options) {
        return this.request(url, 'POST', data, options);
    }

    async put(url, data, options) {
        return this.request(url, 'PUT', data, options);
    }

    async delete(url) {
        return this.request(url, 'DELETE');
    }

    async request(url, method, data, options) {
        log(method + ': ' + url);
        if (this._debugOptions['request']) {
            var str;
            if (options)
                str = JSON.stringify(options, null, '\t');
            else
                str = 'null';
            Logger.info('[webclient(axios)] options:\n' + str);
            if (data) {
                if (data instanceof FormData)
                    str = JSON.stringify(Object.fromEntries(data), null, '\t'); // data.entries()
                else
                    str = JSON.stringify(data, null, '\t');
            } else
                str = 'null';
            Logger.info('[webclient(axios)] data:\n' + str);
        }
        var res;
        var opt;
        var bMeta;
        if (options) {
            opt = { ...options };
            if (opt.hasOwnProperty('meta')) {
                bMeta = opt['meta'];
                delete opt['meta'];
            }
            if (opt.hasOwnProperty('rejectUnauthorized')) {
                if (opt['rejectUnauthorized'] === false)
                    opt['httpsAgent'] = httpsAgent;
                delete opt['rejectUnauthorized'];
            }
            if (opt.hasOwnProperty('formdata')) {
                data = new FormData();
                for (const name in opt['formdata']) {
                    data.append(name, opt['formdata'][name]);
                }
                delete opt['formdata'];
            }
        }
        var response;
        try {
            switch (method) {
                case 'GET':
                    response = await this._ax.get(url, opt);
                    break;
                case 'DELETE':
                    response = await this._ax.delete(url);
                    break;
                case 'POST':
                    response = await this._ax.post(url, data, opt);
                    break;
                case 'PUT':
                    response = await this._ax.put(url, data, opt);
                    break;
                default:
                    throw new Error('Unsupported method');
            }
        } catch (error) { // e.g. unable to verify the first certificate
            //console.log(error);
            if (error.isAxiosError && error['response'])
                response = error['response'];
            else {
                /*var msg;
                if (error['response'] && error['response']['status'])
                    msg = "[axios] download failed with error: " + error['response']['status'] + " - " + error['response']['statusText'];
                else if (error['code'])
                    msg = "[axios] " + error['code'] + " - " + error['message'];
                Logger.parseError(error, msg);*/
                throw error;
            }
        }
        if (response) {
            //console.log(response);
            /*if (this._debugOptions['response']) {
                var str;
                if (response)
                    str = stringify(response);
                else
                    str = 'null';
                Logger.info('[webclient(axios)] response:\n' + str);
            }*/
            if (bMeta)
                res = AxiosWebClient._parseResponse(response);
            else if (response.data)
                res = response.data;
        }
        return Promise.resolve(res);
    }

    /*async getBlob(url) {
        var data;
        if (url) {
            var resp = await this._ax.get(url, { responseType: 'blob' });
            if (resp && resp.data)
                data = resp.data;
        }
        return Promise.resolve(data);
    }*/

    async getBase64(url) {
        log('BASE64: ' + url);
        var res;
        var opt = {
            'responseType': 'arraybuffer' //'stream' / 'blob'
        }
        const response = await this._ax.get(url, opt);
        const contentType = response.headers['content-type'];
        const buffer = Buffer.from(response.data, 'binary'); // Buffer.from(response.data, 'base64');
        res = base64.getStringFromBuffer(contentType, buffer);
        return Promise.resolve(res);
    }

    async download(url, file, options) {
        log('DOWNLOAD(axios): ' + url);

        if (this._debugOptions['download']) {
            var start = Date.now();
            Logger.info('[App] Start: ' + new Date(start).toISOString());
        }

        var fpath;
        var name;
        var ext;
        var index = file.lastIndexOf(path.sep);
        if (index >= 0) {
            fpath = file.substr(0, index);
            name = file.substr(index + 1);
        } else
            name = file;
        index = name.lastIndexOf('.');
        if (index != -1)
            ext = name.substr(index + 1);

        var opt;
        if (options) {
            opt = { ...options };
            if (opt.hasOwnProperty('rejectUnauthorized')) {
                if (opt['rejectUnauthorized'] === false)
                    opt['httpsAgent'] = httpsAgent;
                delete opt['rejectUnauthorized'];
            }
        } else
            opt = {};
        opt['responseType'] = 'stream';
        //opt['onDownloadProgress'] = WebClient._progress;
        const response = await this._ax.get(url, opt);

        var extFromHeader;
        const type = response.headers['content-type'];
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition != 'inline') {
            extFromHeader = disposition.substr(disposition.lastIndexOf('.') + 1);
            if (extFromHeader.endsWith('"'))
                extFromHeader = extFromHeader.substr(0, extFromHeader.length - 1);
        } else if (type) {
            var parts = type.split('/');
            if (parts.length == 2 && !parts[1].startsWith('octet-stream')) {// 'application/octet-stream', 'binary/octet-stream'
                extFromHeader = parts[1];
                parts = extFromHeader.split(';');
                if (parts[0])
                    extFromHeader = parts[0];
            }
        }
        if (extFromHeader) {
            var bChanged = false;
            if (!ext) {
                name += '.' + extFromHeader;
                bChanged = true;
            } else if (ext != extFromHeader) {
                var pic = ['jpg', 'jpeg', 'webp'];
                if (!pic.includes(ext) || !pic.includes(extFromHeader)) {
                    name = name.substr(0, index + 1) + extFromHeader;
                    bChanged = true;
                }
            }
            if (bChanged) {
                if (fpath)
                    file = `${fpath}${path.sep}${name}`;
                else
                    file = name;
            }
        }

        if (fs.existsSync(file))
            throw new Error("File '" + file + "' already exists!");

        if (this._debugOptions['download']) {
            const contentLength = response.headers['content-length'];
            var total = 0;
            var percentage = 0;
            var last = 0;
            response.data.on('data', (chunk) => {
                total += chunk.length;
                percentage = ((total / contentLength) * 100);
                if (percentage - last > 1) {
                    last = percentage;
                    console.log(percentage.toFixed(2) + "%");
                }
            });
        }

        //stream.data.pipe(fs.createWriteStream(file));
        await this._streamToFile(response, file);

        if (this._debugOptions['download']) {
            var end = Date.now();
            Logger.info('[App] End: ' + new Date(end).toISOString());
            var duration = (end - start) / 1000;
            Logger.info('[App] Duration: ' + duration.toFixed(2) + ' sec');

            var stats = fs.statSync(file);
            var size = stats.size / (1024 * 1024);
            Logger.info('[App] Size: ' + size.toFixed(2) + 'MB');

            Logger.info('[App] Speed: ' + (size / duration).toFixed(2) + 'MB/s');
        }

        return Promise.resolve(name);
    }

    async _streamToFile(stream, file) {
        return new Promise((resolve, reject) => {
            var err;
            const writer = fs.createWriteStream(file);
            writer.on('error', error => {
                err = error;
                writer.close();
                reject(error);
            });
            writer.on('close', () => {
                if (err) {
                    if (file && fs.existsSync(file))
                        fs.unlinkSync(file);
                } else
                    resolve();
            });
            stream.data.pipe(writer);
        });
    }

    async isImage(url) {
        return new Promise(async function (resolve) {
            const opt = {
                'responseType': 'stream'
            };
            const response = await this._ax.get(url, opt);
            console.log(response.headers['content-type']);
            var match = response.headers['content-type'].match(/(image)+\//g);
            resolve(match && match.length != 0);
        });
    }
}

module.exports = AxiosWebClient;