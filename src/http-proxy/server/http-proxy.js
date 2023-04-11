const path = require('path');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

class HttpProxy {

    static async forward(req, res, next) {
        var url;
        var options;
        if (req.method == 'GET') {
            url = req.query['url'];
        } else if (req.method == 'POST') {
            var body = req.body;
            url = body['url'];
            options = body['options'];
            /*if (body['method'])
                options['method'] = body['method'];
            if (body['headers'])
                options['headers'] = body['headers'];*/
            if (body['data']) {
                if (typeof body['data'] === 'string' || body['data'] instanceof String)
                    options['body'] = body['data'];
                else
                    options['body'] = JSON.stringify(body['data']);
            }
            if (body['formdata']) {
                const formData = new FormData();
                for (const name in body['formdata']) {
                    formData.append(name, body['formdata'][name]);
                }
                options['body'] = formData;
            }
        }
        if (url) {
            var format = req.query['format'];
            try {
                var response = await HttpProxy.request(url, options);
                if (format == 'json')
                    res.json({ 'data': response });
                else
                    res.send(response);
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
     *  body: '...'
     * }
     * @param {*} url 
     * @param {*} options 
     * @returns 
     */
    static async request(url, options) {
        var data;
        var response = await fetch(url, options);
        if (options['meta']) {
            var data = {};
            data['status'] = response.status;
            data['statusText'] = response.statusText;
            data['url'] = response.url;
            data['redirected'] = response.redirected;
            data['type'] = response.type;
            //data['headers'] = response.headers;
            //data['body'] = response.body;
            if (response.status === 200)
                data['body'] = await response.text();
            //console.log(data);
        } else {
            if (response.status === 200) {
                data = await response.text();
                //data = await response.json();
            }
        }
        return Promise.resolve(data);
    }
}

module.exports = HttpProxy;