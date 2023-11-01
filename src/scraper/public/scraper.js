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
        if (tmp && tmp.length > 0) {
            if (tmp.length == 1)
                rule = tmp[0];
            else
                throw new Error('Multiple matching rules found!');
        }
        return Promise.resolve(rule);
    }

    static async _scrape(rule, url, doc, data) {
        if (rule && rule['funcScrape']) {
            if (!data)
                data = {};
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            var fn = new AsyncFunction('url', 'doc', 'data', rule['funcScrape']);
            data = await fn(url, doc, data);
        }
        return Promise.resolve(data);
    }

    static async openEditScraperModal(ruleObj, url, body, doc) {
        return new Promise(async (resolve, reject) => {
            const controller = app.getController();
            var bLoading = controller.getLoadingState();
            controller.setLoadingState(true);

            /*var model = app.controller.getModelController().getModel('scraper');
            var skeleton = [...model.getModelAttributesController().getAttributes()];*/

            var newConfig;

            var skeleton = [...ruleObj.getSkeleton()];
            skeleton.push(
                {
                    name: 'body',
                    dataType: 'text',
                    readonly: true,
                    size: '10'
                },
                {
                    name: 'result',
                    dataType: 'json'
                }
            );
            var data = { ...ruleObj.getData() };
            data['body'] = body;
            var form = new Form(skeleton, data);
            var $form = await form.renderForm();

            var panel = new Panel();

            var $d = $('<div/>')
                .css({ 'padding': '10' });

            $d.append($form);

            var $test = $('<button>')
                .text('Test')
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        var tmpConfig = await form.readForm();

                        if (!body && tmpConfig['curl'] && url) {
                            body = await HttpProxy.request(url);
                            tmpConfig['body'] = body;
                        }
                        if (!doc && body) {
                            var parser = new DOMParser();
                            doc = parser.parseFromString(body, 'text/html');
                        }

                        tmpConfig['result'] = await Scraper._scrape(tmpConfig, url, doc);
                        form.setFormData(tmpConfig);
                        await form.renderForm();
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(this));
            $d.append($test);

            var $save = $('<button>')
                .text('Save')
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        var data = await form.readForm();
                        if (data['domain']) {
                            delete data['body'];
                            delete data['result'];
                            var oldData = ruleObj.getData();
                            if (oldData['id']) {
                                var changes = CrudObject.getChanges(ruleObj.getSkeleton(), oldData, data);
                                if (changes && Object.keys(changes).length > 0) {
                                    await ruleObj.update(changes);
                                    alert('updated');
                                } else
                                    alert('nothing changed');
                            } else {
                                await ruleObj.create(data);
                                alert('created');
                            }
                        } else
                            alert('field \'domain\' required')
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(panel));
            $d.append($save);
            var $ok = $('<button>')
                .text('Apply')
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        newConfig = await form.readForm();
                        var id = ruleObj.getId();
                        if (id)
                            newConfig['id'] = id;
                        delete newConfig['body'];
                        delete newConfig['result'];
                        await ruleObj.setData(newConfig);

                        controller.setLoadingState(false);
                        this.dispose();
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(panel));
            $d.append($ok);

            panel.setContent($d);

            var modal = await controller.getModalController().openPanelInModal(panel);
            var $modal = modal.getModalDomElement();
            $modal.on("remove", function () {
                controller.setLoadingState(bLoading);
                if (newConfig)
                    resolve();
                else
                    reject();
            });
            controller.setLoadingState(false);
        });
    }
}