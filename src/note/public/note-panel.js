class NotePanel extends CrudPanel {

    _$note;

    _prop;
    _parser;
    _syntax;

    constructor(config, obj, prop) {
        super(config, obj);
        if (prop)
            this._prop = prop;
        else
            this._prop = 'note';
    }

    getClass() {
        return NotePanel;
    }

    setParser(parser) {
        this._parser = parser;
    }

    setSyntax(syntax) {
        this._syntax = syntax;
    }

    async _init() {
        this._bSelectable = false;
        this._bContextMenu = false;

        return super._init();
    }

    async _renderContent() {
        var $div;
        switch (this._config.details) {
            case DetailsEnum.all:
                $div = await super._renderContent();
                break;
            case DetailsEnum.title:
                $div = await this._renderNote();
                break;
            case DetailsEnum.none:
        }
        return Promise.resolve($div);
    }

    async _renderNote() {
        this._$note = $('<div/>')
            .addClass('note')
            //.attr("data-id", obj.getData().id)
            .dblclick(async function () {
                if (!this._$note.hasClass('cellEditing')) {
                    await this._edit(true);
                }
                return Promise.resolve();
            }.bind(this))
            .after('<br />')
            .bind('_close', this._close.bind(this))
            .bind('_abort', this._abort.bind(this));
        await this._edit(false);
        return Promise.resolve(this._$note);
    }

    async _edit(edit) {
        var note = this._obj.getData()[this._prop];
        if (note) {
            if (!this._syntax)
                this._syntax = DataView.getSyntax(note);
            if (this._syntax)
                note = note.substring(note.indexOf(',') + 1);
        }
        if (edit) {
            if (note === undefined || note === null)
                note = '';
            if (this._syntax === 'markdown')
                this._$note.removeClass('markdown');
            else
                this._$note.removeClass('pre');
            this._$note.addClass('cellEditing');
            //this.$note.html("<p name='note' contenteditable>" + encodeText(originalContent) + "</p>");
            this._$note.html("<textarea name='note'>" + note + "</textarea>"); //cols='40' rows='5'
            this._$note.children().first().focus();
        } else {
            this._$note.removeClass('cellEditing');
            var html;
            if (note) {
                if (parser && parser.parse && typeof parser.parse === 'function')
                    html = await parser.parse(note);
                else if (this._syntax === 'markdown')
                    html = await DataView.parseMarkdown(note);
                else
                    html = encodeText(note)
            } else
                html = "";
            this._$note.html(html);
            if (this._syntax === 'markdown') {
                this._$note.addClass('markdown');
                await DataView.highlightBlock(this._$note[0]);
            } else
                this._$note.addClass('pre');
        }
        return Promise.resolve();
    }

    async _abort() {
        return this.render();
    }

    async _close() {
        const controller = app.getController();
        controller.setLoadingState(true);
        try {
            await this._update();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _update() {
        const data = this._readData();
        if (this._obj.getId()) // !this._obj.getModel().getDefinition()['options']['increments']
            await this._obj.update(data);
        else
            await this._obj.create(data);

        await this._edit(false);
        /*const state = new State();
        state['typeString'] = this._obj.getTypeString();
        state['id'] = this._obj.getId();
        app.getController().controller.loadState(state, true);*/
        return Promise.resolve();
    }

    _readData() {
        var newContent = this._$note.children().first().val();
        const data = {};
        if (this._syntax)
            data[this._prop] = 'data:text/' + this._syntax + ';charset=utf-8,' + newContent;
        else
            data[this._prop] = newContent;
        return data;
    }
}

$(document).keyup(function (e) {
    var action;
    if ((e.keyCode == 83 || e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) { // strg+s(not working) or strg+enter
        action = '_close';
    } else if ((e.keyCode == 88 && e.ctrlKey) || e.keyCode == 27) { // strg+x or esc
        action = '_abort';
    }
    if (action) {
        var $note = $(e.target.parentElement);
        if ($note && $note.hasClass('note') && $note.hasClass('cellEditing')) {
            $note.trigger(action);
        }
    }
});