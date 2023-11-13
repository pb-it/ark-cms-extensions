const debug = require('debug');
const log = debug('app:http-proxy');
const path = require('path');
const https = require('https');
//const FormData = require('form-data');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

class HttpProxy {

    static async forward(req, res, next) {
        var url;
        var bCache;
        var options;
        if (req.method == 'GET') {
            url = req.query['url'];
            if (req.query['_cache'])
                bCache = req.query['_cache'] === 'true';
        } else if (req.method == 'POST') {
            const body = req.body;
            url = body['url'];
            options = body['options'];
            if (options && options.hasOwnProperty('bCache')) {
                bCache = options['bCache'];
                delete options['bCache'];
            }
        }
        if (url) {
            log(url);
            if (debug.enabled('app:http-proxy')) {
                var str;
                if (options)
                    str = JSON.stringify(options, null, '\t');
                else
                    str = 'null';
                Logger.info('[app:http-proxy] options:\n' + str);
            }
            try {
                const response = await HttpProxy.request(url, options);
                if (response && bCache) {
                    if (response['status'] == 200 && response['body']) {
                        const model = controller.getShelf().getModel('http-proxy-cache');
                        if (model)
                            await model.create({ 'url': url, 'body': response['body'] });
                    }
                }
                res.json(response);
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
     *  agent: ...
     *  body: '...'
     * }
     * @param {*} url
     * @param {*} options 
     * @returns 
     */
    static async request(url, options) {
        var res;
        var client;
        if (options)
            client = options['client'];
        const webclient = controller.getWebClientController().getWebClient(client);
        if (webclient) {
            if (!client)
                client = webclient.getName();
            var method;
            var data;
            if (options) {
                method = options['method'];
                var agent;
                if (options.hasOwnProperty('rejectUnauthorized')) {
                    if (!options['rejectUnauthorized'])
                        agent = httpsAgent;
                    delete options['rejectUnauthorized'];
                }
                var formData;
                if (options.hasOwnProperty('formdata')) {
                    formData = new FormData();
                    for (const name in options['formdata']) {
                        formData.append(name, options['formdata'][name]);
                    }
                    delete options['formdata'];
                }
                if (!client || client === 'fetch') {
                    if (agent)
                        options['agent'] = agent;
                    if (formData)
                        options['body'] = new URLSearchParams(formData);
                } else if (client === 'axios') {
                    if (agent)
                        options['httpsAgent'] = httpsAgent;
                    if (formData)
                        data = formData;
                    var tmp;
                    if (options.hasOwnProperty('data')) {
                        tmp = options['data'];
                        delete options['data'];
                    }
                    if (options.hasOwnProperty('body')) {
                        tmp = options['body'];
                        delete options['body'];
                    }
                    if (tmp) {
                        if (typeof tmp === 'string' || tmp instanceof String)
                            data = tmp;
                        else
                            data = JSON.stringify(tmp);
                    }
                }
            } else
                options = {};
            options['meta'] = true;
            if (!method)
                method = 'GET';

            res = await webclient.request(url, method, data, options); // await fetch(url, options);
        } else
            throw new Error('WebClient not found');
        return Promise.resolve(res);
    }
}

module.exports = HttpProxy;