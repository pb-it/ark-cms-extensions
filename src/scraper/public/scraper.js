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
        var rule = await Scraper._getRule(url);
        if (rule) {
            var body = await HttpProxy.request(url);
            var parser = new DOMParser();
            var doc = parser.parseFromString(body, 'text/html');
            res = await Scraper._scrape(url, doc, rule);
        }
        return Promise.resolve(res);
    }

    static async _getRule(url) {
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
            var fn = new AsyncFunction('url', 'doc', 'options', rule['funcScrape']);
            data = await fn(url, doc, options);
        }
        return Promise.resolve(data);
    }

    static async openEditScraperModal(url, body, doc, scraper, options) {
        const controller = app.getController();
        controller.setLoadingState(true);
        var panel = new EditScraperPanel(url, body, doc, scraper, options);
        var modal = await controller.getModalController().openPanelInModal(panel);
        controller.setLoadingState(false);
        return Promise.resolve(modal);
    }
}