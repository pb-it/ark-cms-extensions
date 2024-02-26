class CrudPanelOverride extends CrudPanel {

    async _renderCreate() {
        var $div = $('<div/>')
            .addClass('data');
        this._form = new Form(this._skeleton, this._obj.getData());
        var $form = await this._form.renderForm(false);
        $div.append($form);

        $div.append('<br/>');

        $div.append(this._renderActionButtons());
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html("Create")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._create();
                } catch (error) {
                    if (error)
                        app.getController().showError(error);
                }

                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($div);
    }

    async _renderUpdate() {
        var $div = $('<div/>')
            .addClass('data');
        this._form = new Form(this._skeleton, this._obj.getData());
        var $form = await this._form.renderForm(false);
        $div.append($form);

        $div.append('<br/>');

        $div.append(this._renderActionButtons());

        var text = 'Update';
        $div.append($('<button/>')
            .css({ 'float': 'right' })
            .html(text)
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await this._update();
                } catch (error) {
                    if (error)
                        app.getController().showError(error);
                }

                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($div);
    }
}