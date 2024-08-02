async function teardown() {
    var bConfirm = confirm("Delete extension 'backup'?");
    if (bConfirm && confirm("Also delete models?")) {
        const controller = app.getController();
        var model = controller.getModelController().getModel('backup');
        if (model)
            await model.deleteModel();
    }
    return Promise.resolve(bConfirm);
}

export { teardown };