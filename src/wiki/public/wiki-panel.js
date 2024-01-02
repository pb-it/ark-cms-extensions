class WikiPanel extends CrudPanel {

    /*static _convertToPlain(text) {
        return text;
    }*/

    static _convertToHtml(text) {
        text = text.replace(/\[\[([A-ZÄÖÜa-zäöüß0-9_\.\s\+\-\/\\]*)\]\]/g, '<a class="wiki-link" href="wiki-pages?title=$1">[$1]</a>');
        text = text.replace(/<link>([A-ZÄÖÜa-zäöüß@µ§$%!?0-9_\s\/\\\=\:\.\'\"\;\,\#\&\|\-\+\~\*\>]*)<\/link>/g, '<a href="$1">$1</a>');
        text = text.replace(/<code>((?:[A-ZÄÖÜa-zäöüß@µ§$%!?0-9_\s\(\)\{\}\[\]\/\\\=\:\.\'\"\„\“\′\`\^\°\;\,\#\&\|\-\+\~\*\>]|<\/br>|<br>|<\s)*)<\/code>/g, '<div class="wiki_code">$1</div>');
        return text;
    }

    _$page;

    constructor(config, obj) {
        super(config, obj);
    }

    getClass() {
        return WikiPanel;
    }

    async _renderContent() {
        var $div;
        switch (this._config.details) {
            case DetailsEnum.all:
                $div = await super._renderContent();
                break;
            case DetailsEnum.title:
                $div = this._renderPage();
                break;
            case DetailsEnum.none:
        }
        return Promise.resolve($div);
    }

    _renderPage() {
        this._$page = $('<div/>')
            .addClass('page')
            //.attr("data-id", obj.getData().id)
            .dblclick(function () {
                if (!this._$page.hasClass('cellEditing')) {
                    this._edit(true);
                }
            }.bind(this))
            .after('<br />')
            .bind('_close', this._close.bind(this))
            .bind('_abort', this._abort.bind(this));
        const action = this._config.action;
        const bEdit = action && (action == ActionEnum.create || action == ActionEnum.update);
        this._edit(bEdit);
        return this._$page;
    }

    _edit(edit) {
        this._$page.empty();
        const content = this._obj.getData().content;
        if (edit) {
            this._$page.addClass('cellEditing');
            //this.$note.html("<p name='note' contenteditable>" + encodeText(originalContent) + "</p>");
            var $text = $('<textarea>')
                .css({
                    'width': '100%',
                    'height': '100%'
                })
                .text(content)
            this._$page.append($text);
            this._$page.children().first().focus();
        } else {
            this._$page.removeClass('cellEditing');
            var html;
            if (content)
                html = WikiPanel._convertToHtml(content)
            else
                html = "";
            this._$page.html(html);
            this._$page.find('a.wiki-link').click(function (e) {
                e.preventDefault();
                var state = new State();
                state.typeString = 'wiki-pages';
                state.where = this.getAttribute('href').substring('wiki-page?'.length);
                app.controller.loadState(state, true);
                return false;
            });
        }
    }

    async _abort() {
        return this.render();
    }

    async _close() {
        app.controller.setLoadingState(true);

        var newContent = this._$page.children().first().val();
        try {
            await this._obj.update({ 'content': newContent });
            this._edit(false);
        } catch (e) {
            console.log(e);
        } finally {
            app.controller.setLoadingState(false);
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
        var $page = $(e.target.parentElement);
        if ($page && $page.hasClass('page') && $page.hasClass('cellEditing')) {
            $page.trigger(action);
        }
    }
});