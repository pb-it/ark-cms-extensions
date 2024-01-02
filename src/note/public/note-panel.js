class NotePanel extends CrudPanel {

    _$note;

    _prop;
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
        this._syntax = DataView.getSyntax(note);
        if (this._syntax)
            note = note.substring(note.indexOf(',') + 1);
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
                if (this._syntax === 'markdown')
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
        var controller = app.getController();
        controller.setLoadingState(true);
        try {
            var newContent = this._$note.children().first().val();
            var data = {};
            if (this._syntax)
                data[this._prop] = 'data:text/' + this._syntax + ';charset=utf-8,' + newContent;
            else
                data[this._prop] = newContent;
            if (this._obj.getId()) {
                await this._obj.update(data);
                await this._edit(false);
            } else {
                await this._obj.create(data);

                var state = new State();
                state['typeString'] = this._obj.getTypeString();
                state['id'] = this._obj.getId();
                controller.loadState(state, true);
            }
        } catch (e) {
            console.log(e);
        } finally {
            controller.setLoadingState(false);
        }
        return Promise.resolve();
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