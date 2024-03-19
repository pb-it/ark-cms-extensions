async function init() {

    const controller = app.getController();

    if (typeof HttpProxy === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/http-proxy/public/http-proxy.js");
    }

    const model = controller.getModelController().getModel('http-proxy-cache');
    if (model) {
        const attr = model.getModelAttributesController().getAttribute('file');
        if (attr) {
            const file2 = controller.getExtensionController().getExtension('file2');
            if (file2) {
                const dumpEntry = new ContextMenuEntry("Dump to file", async function (event, target) {
                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        const obj = target.getObject();
                        const data = obj.getData();
                        await obj.update({ 'body': null, 'file': { 'url': data['url'], 'base64': Base64.encodeText(data['body'], 'text/html') } });

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
                    if (extGroup)
                        extGroup.entries.push(dumpEntry);
                    else {
                        extGroup = new ContextMenuEntry('Extensions', null, [dumpEntry]);
                        extGroup.setIcon(new Icon('puzzle-piece'));
                        entries.unshift(extGroup);
                    }
                }
            }
        }
    }

    return Promise.resolve();
}

export { init };