class SelectSnippetPanel extends Panel {

    _modelName;
    _model;
    _snippetController;
    _tree;

    constructor(name) {
        super();
        this._modelName = name;
        const controller = app.getController();
        this._model = controller.getModelController().getModel(name);
        this._snippetController = new SnippetController(this._model);
        this._tree = this._snippetController.getTree();

        $(window).on("changed.model", function (event, data) {
            if (!data || (data['name'] === this._modelName)) {
                //this._tree = null;
                this.render();
            }
        }.bind(this));
    }

    async _renderContent() {
        const $div = $('<div/>').css({
            'padding': '10px'
        });

        if (this._tree) {
            var treeConf = this._tree.getTreeConf();
            if (treeConf) {
                var treeNodes = Tree.getAllTreeNodes(treeConf);
                for (let node of treeNodes) {
                    if (!node['type'] || node['type'] === 'node') {
                        node['actions'] = {};

                        node['actions']['clickAction'] = async function (event) {
                            var snippet = this['data']['snippet'];
                            if (snippet) {
                                if (snippet.startsWith('data:')) {
                                    var index = snippet.indexOf(',');
                                    if (index !== -1 && snippet.length > index)
                                        snippet = snippet.substring(index + 1);
                                }
                                const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                                const fn = new AsyncFunction(snippet);
                                const data = await fn();
                            }
                            return Promise.resolve();
                        }.bind(node);

                        node['actions']['editAction'] = async function (node) {
                            const panel = new CrudSnippetPanel(this._snippetController, node);
                            app.getController().getModalController().openPanelInModal(panel);
                            return Promise.resolve(node);
                        }.bind(this);
                    }
                }

                var treeVisConf = { 'editable': true };
                var treeVis = new TreeVis(treeVisConf, this._tree);
                var $tree = treeVis.render();
                $div.append($tree);
                $div.append("<br>");
            }

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    const panel = new CrudSnippetPanel(this._snippetController); // ActionEnum.create
                    return app.getController().getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('add folder')
                .click(async function (event) {
                    event.stopPropagation();

                    const skeleton = [{
                        "name": "name",
                        "dataType": "string"
                    }];
                    const panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function () {
                        const data = await panel.getForm().readForm();
                        this._tree.addTreeNode(data.name);
                        panel.dispose();
                        this.render();
                        return Promise.resolve();
                    }.bind(this));
                    return app.getController().getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            if (app.getController().isInDebugMode()) {
                $div.append($('<button/>')
                    .text('edit json')
                    .click(async function (event) {
                        event.stopPropagation();
                        var changed;
                        const controller = app.getController();
                        try {
                            const conf = this._tree.getTreeConf(true);
                            changed = await controller.getModalController().openEditJsonModal(conf);
                            this._tree.setTreeConf(changed);
                        } catch (error) {
                            if (error)
                                controller.showError(error);
                        }
                        if (changed)
                            this.render();
                        return Promise.resolve();
                    }.bind(this))
                );
            };

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    const controller = app.getController();
                    try {
                        const newData = event.data.getTreeConf(true);
                        //const newData = this._tree.getTreeConf(true);
                        const oldData = this._snippetController.getTreeConfig();
                        const bChanged = !isEqualJson(oldData, newData);
                        if (bChanged) {
                            var bSave = false;
                            if (controller.getConfigController().confirmOnApply())
                                bSave = await controller.getModalController().openDiffJsonModal(oldData, newData);
                            else
                                bSave = true;

                            if (bSave) {
                                await this._snippetController.updateSnippets(newData);
                                alert('Saved successfully');
                            }
                        } else
                            alert('Nothing changed');
                    } catch (error) {
                        if (error)
                            controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }

        return Promise.resolve($div);
    }
}