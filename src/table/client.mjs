async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/table/public';
    if (typeof TableDataType === 'undefined') {
        resources.push(loadScript(publicDir + '/table-data-type.js'));
        resources.push(loadStyle(publicDir + "/table.css"));
    }
    if (typeof TableFormEntry === 'undefined')
        resources.push(loadScript(publicDir + '/table-form-entry.js'));
    if (resources.length > 0)
        await Promise.all(resources);

    const dtc = controller.getDataTypeController();
    const tableDataType = new TableDataType();
    dtc.addDataType(tableDataType);

    return Promise.resolve();
}

export { init };