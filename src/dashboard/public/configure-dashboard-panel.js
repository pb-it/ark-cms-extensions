class ConfigureDashboardPanel extends Panel {

    _models;
    _model;

    _$input;

    constructor() {
        super();

        const controller = app.getController();
        this._models = controller.getModelController().getModels();
        this._model = this._models[0];
    }

    async _init() {
        await super._init();
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        var $input = $('<select/>');
        var name;
        var $option;
        for (var model of this._models) {
            name = model.getName();
            $option = $('<option/>', { 'value': name }).text(name);
            if (this._model === model)
                $option.prop('selected', true);
            $input.append($option);
        }
        $input.on('change', async function (event) {
            const select = event.target;
            const index = select['selectedIndex'];
            const options = select['options'];
            var name = options[index]['text'];
            var tmp = this._models.filter(function (x) { return x.getName() === name });
            if (tmp.length == 1)
                this._model = tmp[0];
            return this.render();
        }.bind(this));
        $div.append($input);
        $div.append('<br />');

        const code = DashboardController.getCode(this._model.getDefinition());
        this._$input = $('<textarea/>')
            .attr('rows', 40)
            .attr('cols', 100)
            .val(code);
        this._$input.keydown(function (e) {
            e.stopPropagation(); //https://www.rockyourcode.com/assertion-failed-input-argument-is-not-an-htmlinputelement/
            if (e.keyCode == 9) { // TAB
                e.preventDefault();
                //TODO: ident selection
                var input = this[0];
                if (input.selectionStart != undefined && input.selectionStart >= '0') {
                    var cursorPosition = input.selectionStart;
                    var txt = this.val();
                    this.val(txt.slice(0, cursorPosition) + '\t' + txt.slice(cursorPosition));
                    cursorPosition++;
                    input.selectionStart = cursorPosition;
                    input.selectionEnd = cursorPosition;
                    input.focus();
                }
                return false;
            }
        }.bind(this._$input));
        $div.append(this._$input);
        $div.append('<br />');

        var $save = $('<button>')
            .text('Save')
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                try {
                    controller.setLoadingState(true);

                    const code = this._$input.val();
                    await DashboardController.updateDashboard(this._model, code);
                    $(window).trigger('changed.model');
                    controller.setLoadingState(false);
                    alert('Saved successfully');
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        $div.append($save);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}