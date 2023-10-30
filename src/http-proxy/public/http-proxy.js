class HttpProxy {

    static async request(url, options, bCache) {
        const ac = app.getController().getApiController();
        const client = ac.getApiClient();

        var res;
        if (bCache) {
            var tmp = await client.requestData('GET', 'http-proxy-cache?url=' + encodeURIComponent(url) + '&_sort=created_at:desc&_limit=1');
            if (tmp && tmp.length == 1) {
                if (confirm("Use cached response?"))
                    res = tmp[0]['body'];
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
}