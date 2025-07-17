async function init() {
    const controller = app.getController();
    const model = controller.getModelController().getModel('backup');

    const entry = new ContextMenuEntry("Restore", async function (event, target) {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);
            var panels;
            const sc = controller.getSelectionController();
            if (sc)
                panels = sc.getSelected();
            if (!panels || (panels.length == 1 && panels[0] == target)) {
                const data = target.getObject().getData();
                const ac = controller.getApiController();
                const client = ac.getApiClient();
                const response = await client.request('GET', `/api/data/v1/backup/${data['id']}/restore`);
                if (response && response == 'OK') {
                    alert('Backup restored successfully!');
                } else
                    throw new Error('Restoring Backup failed!');
                controller.setLoadingState(false);
            }
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
            extGroup.entries.push(entry);
        else {
            extGroup = new ContextMenuEntry('Extensions', null, [entry]);
            extGroup.setIcon(new Icon('puzzle-piece'));
            entries.unshift(extGroup);
        }
    }

    return Promise.resolve();
}

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

export { init, teardown };