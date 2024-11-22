class Scraper {

    static async initModel() {
        const model = app.getController().getModelController().getModel('scraper');

        var testAction = {
            'name': 'Test',
            'fn': async function (data) {
                const controller = app.getController();
                try {
                    var url = prompt('URL:');
                    if (url) {
                        controller.setLoadingState(true);
                        data = await Scraper.scrape(url);
                        await controller.getModalController().openPanelInModal(new JsonPanel(data));
                        controller.setLoadingState(false);
                    }
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

    static getMetaProperty(doc, property) {
        var value;
        var meta = doc.querySelectorAll("meta");
        var attribute;
        for (var i = 0; i < meta.length; i++) {
            attribute = meta[i].attributes[0];
            if (attribute.name === "property" && attribute.value === property) {
                value = meta[i].attributes[1].value;
                break;
            }
        }
        return value;
    }

    static async scrape(url) {
        var res;
        const rule = await Scraper.getRule(url);
        if (rule) {
            const body = await HttpProxy.request(url, rule['options']);
            const parser = new DOMParser();
            const doc = parser.parseFromString(body, 'text/html');
            res = await Scraper._scrape(url, doc, rule);
        }
        return Promise.resolve(res);
    }

    static async getRule(url) {
        var rule;
        var tmp = new URL(url);
        var domain = tmp.hostname;
        const ac = app.getController().getApiController();
        const client = ac.getApiClient();
        var resource = 'scraper?domain=' + domain;
        tmp = await client.requestData('GET', resource);
        if (tmp && tmp.length > 0) {
            if (tmp.length == 1)
                rule = tmp[0];
            else
                throw new Error('Multiple matching rules found!');
        }
        return Promise.resolve(rule);
    }

    static async _scrape(url, doc, rule, options) {
        var data;
        if (rule && rule['funcScrape']) {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            var fn;
            if (options && options['console']) {
                fn = new AsyncFunction('console', 'url', 'doc', 'options', rule['funcScrape']);
                data = await fn(options['console'], url, doc, options);
            } else {
                fn = new AsyncFunction('url', 'doc', 'options', rule['funcScrape']);
                data = await fn(url, doc, options);
            }

        }
        return Promise.resolve(data);
    }
}