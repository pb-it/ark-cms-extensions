async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/http-proxy/public";
    if (typeof HttpProxy === 'undefined')
        resources.push(loadScript(publicDir + "/http-proxy.js"));
    if (typeof TestHttpProxyPanel === 'undefined')
        resources.push(loadScript(publicDir + "/test-http-proxy-panel.js"));
    if (resources.length > 0)
        await Promise.all(resources);

    const route = {
        "regex": "^/http-proxy$",
        "fn": async function (path) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                const panel = new TestHttpProxyPanel();
                controller.getView().getCanvas().showPanels([panel]);
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    const model = controller.getModelController().getModel('http-proxy-cache');
    if (model) {
        const attr = model.getModelAttributesController().getAttribute('file');
        if (attr) {
            var dumpEntry;
            var tmp = await controller.getDataService().fetchData('_extension', null, 'name=file2');
            if (tmp.length == 1) {
                dumpEntry = new ContextMenuEntry("Dump to file", async function (event, target) {
                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        var selected;
                        var objects;
                        const sc = controller.getSelectionController();
                        if (sc)
                            selected = sc.getSelectedObjects();
                        if (selected && selected.length > 0)
                            objects = selected;
                        else
                            objects = [target.getObject()];


                        var data;
                        const ac = controller.getApiController();
                        const client = ac.getApiClient();
                        var response;
                        for (var obj of objects) {
                            data = obj.getData();
                            //await obj.update({ 'body': null, 'file': { 'url': data['url'], 'base64': Base64.encodeText(data['body'], 'text/html') } });
                            response = await client.request('GET', `/api/data/v1/http-proxy-cache/${data['id']}/dump`);
                            if (!response || response !== 'OK')
                                throw new Error('Dump failed!');
                        }

                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                });
            }
            const downloadEntry = new ContextMenuEntry("Download", async function (event, target) {
                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    var selected;
                    var object;
                    const sc = controller.getSelectionController();
                    if (sc)
                        selected = sc.getSelectedObjects();
                    if (selected && selected.length > 0) {
                        if (selected.length === 1)
                            object = selected[0];
                        else
                            alert('Only single selection supported!');
                    } else
                        object = target.getObject();

                    if (object) {
                        var data = object.getData();
                        if (data['body']) {
                            try {
                                FileCreator.createFileFromText('response.html', data['body']);
                            } catch (error) {
                                controller.showError(error);
                            }
                        }
                    }

                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            });

            const entries = model.getContextMenuEntries();
            if (entries) {
                var extGroup = null;
                for (var e of entries) {
                    if (e.getName() === 'Extensions') {
                        extGroup = e;
                        break;
                    }
                }
                if (extGroup) {
                    if (dumpEntry)
                        extGroup.entries.push(dumpEntry);
                    extGroup.entries.push(downloadEntry);
                } else {
                    tmp = [];
                    if (dumpEntry)
                        tmp.push(dumpEntry);
                    tmp.push(downloadEntry);
                    extGroup = new ContextMenuEntry('Extensions', null, tmp);
                    extGroup.setIcon(new Icon('puzzle-piece'));
                    entries.unshift(extGroup);
                }
            }
        }
    }

    var application = {
        'name': 'HttpProxy',
        'icon': new Icon('globe'),
        'start': async function (event) {
            return app.getController().loadState(new State({ customRoute: '/http-proxy' }), true);
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

async function teardown() {
    var bConfirm = confirm("Delete extension 'http-proxy'?");
    if (bConfirm) {
        const controller = app.getController();
        const model = controller.getModelController().getModel('http-proxy-cache');
        if (model) {
            if (confirm("Delete model 'http-proxy-cache'?"))
                await model.deleteModel();
        }
    }
    return Promise.resolve(bConfirm);
}

export { init, teardown };