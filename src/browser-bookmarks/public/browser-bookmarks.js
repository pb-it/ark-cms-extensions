class BrowserBookmarks {

    static _getSubTree(tree, guid) {
        var subTree;
        if (tree.children) {
            for (var child of tree.children) {
                if (child.guid === guid)
                    subTree = child;
                else
                    subTree = BrowserBookmarks._getSubTree(child, guid);
                if (subTree)
                    break;
            }
        }
        return subTree;
    }

    static async _upload() {
        return new Promise((resolve, reject) => {
            try {
                const $input = $('<input/>')
                    .prop('type', 'file')
                    .prop('accept', 'application/json')
                    .on('change', function () {
                        if (this.files.length == 1) {
                            const reader = new FileReader();
                            reader.onload = async function fileReadCompleted() {
                                if (reader.result) {
                                    const bookmarks = JSON.parse(reader.result);
                                    console.log(bookmarks);
                                    var toolbar = BrowserBookmarks._getSubTree(bookmarks, 'toolbar_____');
                                    resolve(toolbar);
                                }
                            };
                            reader.readAsText(this.files[0]);
                        } else
                            resolve();
                    })
                    .on('cancel', function () {
                        resolve();
                    });
                $input.click();
            } catch (error) {
                app.getController().showError(error, 'Upload failed!');
                reject(error);
            }
        });
    }

    static async initModel() {
        const controller = app.getController();
        const model = controller.getModelController().getModel('browser-bookmarks');

        const extensions = controller.getView().getTopNavigationBar().getBreadcrumb().getBreadcrumbExtensions();
        var menu = {
            func: () => {
                var conf;
                const controller = app.getController();
                if (controller.hasConnection()) {
                    var state = controller.getStateController().getState();
                    var bShow;
                    if (state) {
                        if (state.typeString === 'browser-bookmarks' && (!state.action || state.action == ActionEnum.read))
                            bShow = true;
                    }
                    if (bShow) {
                        var func = async function (event, icon) {
                            const controller = app.getController();
                            try {
                                controller.setLoadingState(true);

                                const bm = await BrowserBookmarks._upload();
                                const obj = new CrudObject('browser-bookmarks', { 'dump': bm });
                                const model = obj.getModel();
                                const mpcc = model.getModelPanelConfigController();
                                const panelConfig = mpcc.getPanelConfig(ActionEnum.create, DetailsEnum.all);
                                const panel = PanelController.createPanelForObject(obj, panelConfig);
                                var modal = await controller.getModalController().openPanelInModal(panel);

                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }
                            return Promise.resolve();
                        };

                        conf = {
                            //'style': 'iconbar',
                            'icon': new Icon('upload'),
                            'root': true,
                            'tooltip': 'Upload', // 'Partitioning / Segmentation'
                            'click': func,
                            'style': 'custom-style'
                        };
                    }
                }
                return conf;
            }
        }
        extensions.push(menu);

        if (model._crudDialogActions) {
            var checkAction = {
                'name': 'Upload',
                'fn': async function (data) {
                    try {
                        var bm = await BrowserBookmarks._upload();
                        if (bm)
                            data['dump'] = bm;
                    } catch (error) {
                        app.getController().showError(error);
                    }
                    return Promise.resolve(data);
                }
            };
            model._crudDialogActions.push(checkAction);
        }

        return Promise.resolve();
    }

}