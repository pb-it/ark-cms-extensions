class Scraper {

    static async initModel() {
        const model = app.getController().getModelController().getModel('scraper');

        var testAction = {
            'name': 'Test',
            'fn': async function (data) {
                const controller = app.getController();
                try {
                    var url = prompt('URL:');
                    controller.setLoadingState(true);
                    data = await Scraper.scrape(url);
                    await controller.getModalController().openPanelInModal(new JsonPanel(data));
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve(data);
            }
        };
        model._crudDialogActions.push(testAction);

        return Promise.resolve();
    }

    static async scrape(url) {
        var res;
        var rule = await Scraper._getRule(url);
        if (rule) {
            var body = await HttpProxy.request(url);
            var parser = new DOMParser();
            var doc = parser.parseFromString(body, 'text/html');
            res = await Scraper._scrape(rule, url, doc);
        }
        return Promise.resolve(res);
    }

    static async _getRule(url) {
        var rule;
        var tmp = new URL(url);
        var domain = tmp.hostname;
        const ac = app.getController().getApiController();
        const client = ac.getApiClient();
        tmp = await client.requestData('GET', 'scraper?domain=' + domain);
        if (tmp) {
            if (tmp.length == 1)
                rule = tmp[0];
            else
                throw new Error('Multiple matching rules found!');
        }
        return Promise.resolve(rule);
    }

    static async _scrape(rule, url, doc, data) {
        if (rule && rule['function']) {
            if (!data)
                data = {};
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            var fn = new AsyncFunction('url', 'doc', 'data', rule['function']);
            data = await fn(url, doc, data);
        }
        return Promise.resolve(data);
    }
}