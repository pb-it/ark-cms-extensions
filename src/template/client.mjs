async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/template/public';
    if (typeof Template === 'undefined')
        resources.push(loadScript(publicDir + '/js/template.js'));
    if (typeof TemplateDataType === 'undefined') {
        resources.push(loadScript(publicDir + '/js/template-dt.js'));
        resources.push(loadStyle(publicDir + '/css/template.css'));
    }
    if (resources.length > 0)
        await Promise.all(resources);

    await Template.init();

    const dtc = controller.getDataTypeController();
    const templateDataType = new TemplateDataType();
    dtc.addDataType(templateDataType);

    return Promise.resolve();
}

/**
 * Called from system after model initialization / creation or update of model
 * @param {*} model 
 * @returns 
 */
async function initModel(model) {
    // ...
    return Promise.resolve();
}

async function configure() {
    const panel = new Panel();
    const $div = $('<div/>')
        .css({ 'padding': '10' });

    $div.append(`<b>Configure:</b><br/>
Nothing to configure by now ...<br/><br/>`);

    const $close = $('<button/>')
        .text('Close')
        .css({ 'float': 'right' })
        .click(async function (event) {
            event.preventDefault();
            panel.dispose();
            return Promise.resolve();
        }.bind(this));
    $div.append($close);

    panel.setContent($div);

    return app.getController().getModalController().openPanelInModal(panel);
}

async function teardown() {
    const bConfirm = confirm("Delete extension 'backup'?");
    if (bConfirm && confirm("Also delete created model 'template'?")) {
        const controller = app.getController();
        const model = controller.getModelController().getModel('template');
        if (model)
            await model.deleteModel();
    }
    return Promise.resolve(bConfirm);
}

export { init, initModel, configure, teardown };