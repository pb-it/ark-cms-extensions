const debug = require('debug');
const log = debug('app:http-proxy');
const path = require('path');
const https = require('https');
//const FormData = require('form-data');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const base64 = require(path.join(appRoot, './src/common/base64.js'));

class HttpProxy {

    static _ruleset;

    static async init() {
        const model = controller.getShelf().getModel('http-proxy-rules');
        if (model) {
            var tmp = await model.readAll();
            if (tmp && tmp.length > 0) {
                for (var rule of tmp) {
                    HttpProxy.addRule(rule);
                }
            }
        }

        const ws = controller.getWebServer();
        ws.addCustomDataRoute(
            {
                'regex': '^/http-proxy-cache/(\\d+)/dump$', // /api/data/v1/http-proxy-cache/<id>/dump
                'fn': async function (req, res) {
                    try {
                        const model = controller.getShelf().getModel('http-proxy-cache');
                        if (model) {
                            const id = req.locals['match'][1];
                            const x = await model.read(id);
                            if (x && !x['file']) {
                                await model.update(id, {
                                    'file': {
                                        'url': x['url'],
                                        'base64': base64.encodeText(x['body'], 'text/html')
                                    },
                                    'body': null
                                });
                            } else
                                throw new Error("Dump failed!");
                        }
                        res.send('OK');
                    } catch (error) {
                        Logger.parseError(error);
                        res.status(500);
                        res.send("Something went wrong!");
                    }
                    return Promise.resolve();
                }
            }
        );

        return Promise.resolve();
    }

    static addRule(rule) {
        if (HttpProxy._ruleset)
            HttpProxy._ruleset.push(rule);
        else
            HttpProxy._ruleset = [rule];
    }

    static async forward(req, res, next) {
        var url;
        var options;
        if (req.method == 'GET') {
            url = req.query['url'];
            if (req.query['_cache'] && req.query['_cache'] === 'true')
                options = { 'bCache': true };
        } else if (req.method == 'POST') {
            const body = req.body;
            url = body['url'];
            options = body['options'];
        }
        if (url) {
            var rule;
            if (HttpProxy._ruleset && HttpProxy._ruleset.length > 0) {
                var match;
                for (var x of HttpProxy._ruleset) {
                    if (x['url'] && x['url'].startsWith('^') && x['url'].endsWith('$')) {
                        match = new RegExp(x['url'], 'ig').exec(url);
                        if (match) {
                            rule = x;
                            break;
                        }
                    }
                }
            }
            if (rule) {
                if (debug.enabled('app:http-proxy'))
                    Logger.info('[app:http-proxy] rule:\n' + JSON.stringify(rule, null, '\t'));
                if (rule['options']) {
                    if (options) {
                        var defaults = { ...rule['options'] };
                        for (var prop in options) {
                            defaults[prop] = options[prop];
                        }
                        options = defaults;
                    } else
                        options = rule['options'];
                }
            }
            try {
                var response;
                if (rule && rule['fn']) {
                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    const fn = new AsyncFunction('exports', 'require', 'module', '__filename', '__dirname', 'url', 'options', rule['fn']);
                    response = await fn(exports, require, module, __filename, __dirname, url, options);
                } else
                    response = await HttpProxy.request(url, options);
                if (response)
                    res.json(response);
                else
                    next();
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

    /**
     * options: {
     *  method: 'POST',
     *  headers: {
     *    ...
     *  },
     *  client: ...
     *  body: ...
     * }
     * @param {*} url
     * @param {*} options 
     * @returns 
     */
    static async request(url, options) {
        var res;
        log(url);
        if (debug.enabled('app:http-proxy')) {
            var str;
            if (options)
                str = JSON.stringify(options, null, '\t');
            else
                str = 'null';
            Logger.info('[app:http-proxy] options:\n' + str);
        }
        var opt;
        var client;
        var bCache;
        if (options) {
            opt = { ...options };
            if (opt.hasOwnProperty('client')) {
                client = opt['client'];
                delete opt['client'];
            }
            if (opt.hasOwnProperty('bCache')) {
                bCache = opt['bCache'];
                delete opt['bCache'];
            }
        }
        const webclient = controller.getWebClientController().getWebClient(client);
        if (webclient) {
            var method;
            var data;
            if (opt) {
                var tmp;
                if (opt.hasOwnProperty('method')) {
                    method = opt['method'];
                    delete opt['method'];
                }
                if (opt.hasOwnProperty('data')) {
                    tmp = opt['data'];
                    delete opt['data'];
                }
                if (opt.hasOwnProperty('body')) {
                    tmp = opt['body'];
                    delete opt['body'];
                }
                if (tmp) {
                    if (typeof tmp === 'string' || tmp instanceof String)
                        data = tmp;
                    else
                        data = JSON.stringify(tmp);
                }
            } else
                opt = {};
            opt['meta'] = true;
            if (!method)
                method = 'GET';
            res = await webclient.request(url, method, data, opt); // await fetch(url, opt);
            if (res && bCache) {
                if (res['status'] == 200 && res['body']) {
                    const model = controller.getShelf().getModel('http-proxy-cache');
                    if (model)
                        await model.create({ 'url': url, 'body': res['body'] });
                }
            }
        } else
            throw new Error('WebClient not found');
        return Promise.resolve(res);
    }
}

module.exports = HttpProxy;