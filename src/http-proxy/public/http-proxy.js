class HttpProxy {

    /**
     * Supported options depend on used backend client:
     * * client, rejectUnauthorized, formdata, bCache, meta
     * * method, mode, credentials, ...
     * * headers, redirect, ...
     * * body/data, agent/httpsAgent
     * @param {*} url 
     * @param {*} options
     * @returns 
     */
    static async request(url, options) {
        var res;
        if (options && options['bCache']) {
            var tmp = await HttpProxy.lookup(url);
            if (tmp) {
                if (confirm("Use cached response?")) {
                    if (tmp['body'])
                        res = tmp['body'];
                    else if (tmp['file']) {
                        /*const obj = new CrudObject('http-proxy-cache', tmp);
                        const url = obj.getAttributeValue('file');*/
                        var url;
                        const controller = app.getController();
                        const model = controller.getModelController().getModel('http-proxy-cache');
                        if (model) {
                            const attr = model.getModelAttributesController().getAttribute('file');
                            if (attr)
                                url = CrudObject._buildUrl(attr['cdn'], tmp['file']);
                        }
                        if (url) {
                            /*const ac = controller.getApiController();
                            const client = ac.getApiClient();
                            res = await client.request('GET', url);*/
                            res = await HttpClient.request('GET', url, { 'withCredentials': true });
                        }
                    }
                }
            }
        }
        if (!res) {
            var data = {
                'url': url
            };
            if (options)
                data['options'] = options;

            const ac = app.getController().getApiController();
            const client = ac.getApiClient();
            var tmp = await client.request('POST', '/api/ext/http-proxy/forward', null, data);
            if (tmp && tmp.length > 0) {
                const response = JSON.parse(tmp);
                if (response && response['status'] == 200)
                    res = response['body'];
                else
                    throw new HttpError(null, response);
            } else
                throw new Error('Empty HTTP Response');
        }
        return Promise.resolve(res);
    }

    static async lookup(url, options) {
        var res;
        const ac = app.getController().getApiController();
        const client = ac.getApiClient();
        var sort;
        var limit;
        if (options) {
            sort = options['sort'];
            limit = options['limit'];
        }
        if (!sort)
            sort = 'created_at:desc';
        if (!limit)
            limit = 1;
        var purl = 'http-proxy-cache?url=' + encodeURIComponent(url) + '&_sort=' + sort + '&_limit=' + limit;
        var tmp = await client.requestData('GET', purl);
        if (tmp) {
            if (tmp.length > 0) {
                if (limit === 1)
                    res = tmp[0];
                else
                    res = tmp;
            }
        }
        return Promise.resolve(res);
    }
}