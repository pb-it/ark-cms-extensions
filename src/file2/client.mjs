async function configure() {
    const controller = app.getController();
    const ds = controller.getDataService();
    const skeleton = [
        {
            name: 'funcFileName',
            dataType: 'text',
            size: '20'
        }
    ];
    const data = {};
    var funcFileName;
    var tmp = await ds.fetchData('_registry', null, 'key=ext.file2.funcFileName');
    if (tmp && tmp.length == 1)
        funcFileName = tmp[0]['value'];
    if (funcFileName)
        data['funcFileName'] = funcFileName;
    else
        data['funcFileName'] = '';

    const panel = new FormPanel(null, skeleton, data);
    panel.setApplyAction(async function () {
        try {
            controller.setLoadingState(true);
            const changed = await panel.getChanges();
            if (changed) {
                if (changed.hasOwnProperty('funcFileName')) {
                    if (changed['funcFileName'])
                        await ds.request('_registry', ActionEnum.update, null, { 'key': 'ext.file2.funcFileName', 'value': changed['funcFileName'] });
                    else
                        await ds.request('_registry', ActionEnum.delete, null, { 'key': 'ext.file2.funcFileName' });

                    const ac = app.getController().getApiController();
                    const client = ac.getApiClient();
                    const response = await client.request('GET', '/api/ext/file2/init');
                    if (!response || response !== 'OK') {
                        console.error(response);
                        alert('ERROR');
                    }
                }
            }
            panel.dispose();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    });
    return controller.getModalController().openPanelInModal(panel);
}

async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof File2DataType === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/file2/public/file2-data-type.js"));
    if (typeof File2FormEntry === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/file2/public/file2-form-entry.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    const dtc = controller.getDataTypeController();
    const file2DataType = new File2DataType();
    dtc.addDataType(file2DataType);

    return Promise.resolve();
}

export { init, configure };