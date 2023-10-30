class HttpProxy {

    static async request(url, options, bCache) {
        const ac = app.getController().getApiController();
        const client = ac.getApiClient();

        var res;
        if (bCache) {
            var tmp = await HttpProxy.lookup(url);
            if (tmp) {
                if (confirm("Use cached response?"))
                    res = tmp['body'];
            }
        }
        if (!res) {
            var data = { 'url': url };
            if (options)
                data['options'] = options;
            else
                data['options'] = {
                    'method': 'GET'
                };
            if (bCache)
                data['bCache'] = true;
            res = await client.request('POST', '/api/ext/http-proxy/forward', data);
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