async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof EditorjsDataType === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/editorjs/public/editorjs-data-type.js"));
    if (typeof EditorjsFormEntry === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/editorjs/public/editorjs-form-entry.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    const dtc = controller.getDataTypeController();
    const editorjsText = new EditorjsDataType();
    dtc.addDataType(editorjsText);

    return Promise.resolve();
}

export { init };