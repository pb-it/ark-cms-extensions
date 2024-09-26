class ManageBookmarkPanel extends TabPanel {

    _bookmarkController;

    _$managePanel;
    _tree;

    _$jsonPanel;
    _jsonForm;

    constructor(config, bookmarkController) {
        super(config);
        this._bookmarkController = bookmarkController;
    }

    async _init() {
        await super._init();

        this._$managePanel = await this._createManagePanel();
        this._panels.push(this._$managePanel);

        if (app.getController().isInDebugMode()) {
            this._$jsonPanel = await this._createJsonPanel();
            this._panels.push(this._$jsonPanel);
        }

        await this.openTab(this._$managePanel);

        return Promise.resolve();
    }

    async _createManagePanel() {
        const panel = new Panel({ 'title': 'Manage' });
        panel._renderContent = async function () {
            const $div = $('<div/>');

            if (!this._tree) {
                var bookmarks = this._bookmarkController.getBookmarks();
                if (bookmarks) {
                    const treeNodes = Tree.getAllTreeNodes(bookmarks);
                    for (let node of treeNodes) {
                        if (!node['type'] || node['type'] === 'node') {
                            node.click = function (event) {
                                app.controller.loadState(new State(this), true);
                            }.bind(node);
                        }
                    }

                } else
                    bookmarks = [];

                this._tree = new Tree(bookmarks);
            }
            if (this._tree) {
                const treeVisConf = { 'editable': false };
                const treeVis = new TreeVis(treeVisConf, this._tree);
                $div.append(treeVis.render());
                $div.append("<br>");
            }

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    controller.getView().getSideNavigationBar().close();

                    const panel = new CrudStatePanel(ActionEnum.create);
                    return controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('add folder')
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    const skeleton = [{
                        "name": "name",
                        "dataType": "string"
                    }];
                    const panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function () {
                        const data = await panel.getForm().readForm();
                        this.addTreeNode(data.name);
                        panel.dispose();
                        return Promise.resolve();
                    }.bind(this._tree));
                    return controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    try {
                        if (event.data)
                            ;//TODO: app.getController().getModelController().getModel(...).getModelStateController().updateStates(event.data.getTreeConf().nodes);
                    } catch (error) {
                        app.getController().showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createJsonPanel() {
        const panel = new Dialog({ 'title': 'JSON' });
        panel._renderDialog = async function () {
            const $div = $('<div/>')
                .css({ 'padding': '10' });

            const skeleton = [
                { name: "json", dataType: "json" }
            ];
            const data = { "json": JSON.stringify(this._tree.getTreeConf().nodes, null, '\t') };

            this._jsonForm = new Form(skeleton, data);
            const $form = await this._jsonForm.renderForm();

            $div.append($form);
            return Promise.resolve($div);
        }.bind(this);
        panel.setApplyAction(async function () {
            const fData = await this._jsonForm.readForm();
            await this._bookmarkController.setBookmarks(JSON.parse(fData['json']));

            this.dispose();
            return Promise.resolve(true);
        }.bind(this));

        return Promise.resolve(panel);
    }
}