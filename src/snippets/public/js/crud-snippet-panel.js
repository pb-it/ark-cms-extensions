class CrudSnippetPanel extends Panel {

    _snippetController;
    _model;
    _node;
    _snippet;

    constructor(snippetController, node) {
        super();
        this._snippetController = snippetController;
        this._model = this._snippetController.getModel();
        this._node = node;
        if (this._node)
            this._snippet = this._node['data'];
    }

    async _renderContent() {
        const $div = $('<div/>');

        const controller = app.getController();
        const ds = controller.getDataService();

        const mSnippet = controller.getModelController().getModel('snippets');
        const skeleton = [...mSnippet.getModelAttributesController().getAttributes(false)];
        for (var attr of skeleton) {
            if (attr['name'] === 'model' || attr['name'] === 'environment')
                attr['readonly'] = true;
        }

        if (this._snippet) {
            const id = this._snippet['model'];
            if (id) {
                const models = controller.getModelController().getModels();
                var tmp = models.filter(function (x) { return x.getId() === id });
                if (tmp.length === 1) {
                    var model = tmp[0];
                    var obj = await ds.fetchObjectById('_model', model.getId());
                    this._snippet['model'] = obj.getData();
                    if (this._model) {
                        if (this._model != model)
                            throw new Error('Invalid data');
                    } else
                        this._model = model;
                }
            }
        } else {
            if (this._model) {
                const obj = await ds.fetchObjectById('_model', this._model.getId());
                this._snippet = { 'model': obj.getData(), 'environment': 'browser', 'snippet': 'data:text/javascript;charset=utf-8,' };
            }
        }
        const form = new Form(skeleton, this._snippet);
        const $form = await form.renderForm();

        $form.append('<br/><br/>');

        var label;
        if (this._node)
            label = 'Update';
        else
            label = 'Save';
        $form.append($('<button/>')
            .html(label)
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    const snippet = await form.readForm();
                    snippet['model'] = this._model.getId();
                    var name;
                    if (snippet['title'])
                        name = snippet['title'];
                    else
                        name = 'undefined';

                    const tree = this._snippetController.getTree();
                    const conf = tree.getTreeConf(true);
                    if (this._node) {
                        this._node['name'] = name;
                        this._node['data'] = snippet;
                        await this._snippetController.updateSnippets(conf);
                        $(window).trigger('changed.model');
                        alert('Updated successfully');
                    } else {
                        conf.push({ 'name': name, 'data': snippet });
                        await this._snippetController.updateSnippets(conf);
                        $(window).trigger('changed.model');
                        alert('Saved successfully');
                    }
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this))
        );

        /*$form.append($('<button/>')
            .html('Execute')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();
                const snippet = await form.readForm();
                this._execute(snippet);
            }.bind(this))
        );*/

        $div.append($form);

        return Promise.resolve($div);
    }

    /*async _execute(snippet) {
        this.dispose();
        //TODO:
    }*/
}