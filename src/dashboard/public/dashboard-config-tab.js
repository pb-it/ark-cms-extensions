class DashboardConfigTab extends Panel {

    _model;

    _$input;

    constructor() {
        super({ 'title': 'Dashboard' });
    }

    async init(model) {
        this._model = model;
        return Promise.resolve();
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

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

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async applyChanges(definition) {
        if (this._$input)
            DashboardController.updateDefinition(definition, this._$input.val());
        return Promise.resolve();
    }
}