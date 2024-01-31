async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof MimeTextDataType === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/mime-text/public/mime-text-data-type.js"));
    if (typeof MimeTextFormEntry === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/mime-text/public/mime-text-form-entry.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    const dtc = controller.getDataTypeController();
    const mimeTextDataType = new MimeTextDataType();
    dtc.addDataType(mimeTextDataType);

    return Promise.resolve();
}

export { init };