class EditorjsFormEntry extends FormEntry {

    static createObserver(containerSelector, elementSelector, callback) {
        const onMutationsObserved = function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length) {
                    var elements = $(mutation.addedNodes).find(elementSelector);
                    for (var i = 0, len = elements.length; i < len; i++) {
                        callback(elements[i]);
                    }
                }
            });
        };
        const target = $(containerSelector)[0];
        const config = { childList: true, subtree: true };
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        const observer = new MutationObserver(onMutationsObserved);
        observer.observe(target, config);
        return observer;
    }

    _observer;
    _editor;

    _$editor;

    constructor(form, attribute) {
        super(form, attribute);
    }

    _addObserver() {

    }

    getInput() {
        return this._$editor;
    }

    async renderValue(value) {
        if (typeof EditorJS === 'undefined') {
            const scripts = [];
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/header@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/simple-image@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/list@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/quote@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/code@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/embed@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/table@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/link@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/warning@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/marker@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest"));
            scripts.push(loadScript("https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest"));
            await Promise.all(scripts);
        }

        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');
        this._$editor = $('<div/>')
            .attr('id', 'editorjs')
            .css({
                'border': '1px solid gray',
                'resize': 'both',
                'overflow': 'auto',
                'background': '#FFFFFF'
            });
        this._$value.append(this._$editor);

        var data;
        if (value)
            data = JSON.parse(value);
        else
            data = {
                blocks: [
                    /*{
                        type: "header",
                        data: {
                            text: "Editor.js",
                            level: 2
                        }
                    },*/
                    {
                        type: 'paragraph',
                        data: {
                            text: 'Text...'
                        }
                    }
                ]
            };

        this._observer = EditorjsFormEntry.createObserver('body', '#editorjs', function (element) {
            this._editor = new EditorJS({
                holder: 'editorjs',
                data: data,
                readOnly: false,
                tools: {
                    //TODO: Parsing Header fails!
                    /*header: {
                        class: Header,
                        inlineToolbar: ['marker', 'link'],
                        config: {
                            placeholder: 'Header'
                        },
                        shortcut: 'CMD+SHIFT+H'
                    },*/

                    image: SimpleImage,

                    /*list: {
                        class: List,
                        inlineToolbar: true,
                        shortcut: 'CMD+SHIFT+L'
                    },

                    checklist: {
                        class: Checklist,
                        inlineToolbar: true,
                    },

                    quote: {
                        class: Quote,
                        inlineToolbar: true,
                        config: {
                            quotePlaceholder: 'Enter a quote',
                            captionPlaceholder: 'Quote\'s author',
                        },
                        shortcut: 'CMD+SHIFT+O'
                    },

                    warning: Warning,

                    marker: {
                        class: Marker,
                        shortcut: 'CMD+SHIFT+M'
                    },

                    code: {
                        class: CodeTool,
                        shortcut: 'CMD+SHIFT+C'
                    },

                    delimiter: Delimiter,

                    inlineCode: {
                        class: InlineCode,
                        shortcut: 'CMD+SHIFT+C'
                    },

                    linkTool: LinkTool,

                    embed: Embed,*/

                    table: {
                        class: Table,
                        inlineToolbar: true,
                        shortcut: 'CMD+ALT+T'
                    }
                },
                onReady: () => {
                    //console.log('Editor.js is ready to work!')
                },
                onChange: (api, event) => {
                    //console.log('Now I know that Editor\'s content changed!', event)
                }
            });
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
        }.bind(this));

        return Promise.resolve(this._$value);
    }

    async readValue() {
        var data;
        if (this._editor) {
            try {
                var tmp = await this._editor.save();
                if (tmp)
                    data = JSON.stringify(tmp);
            } catch (error) {
                app.getController().showError(error);
            }
        }
        return Promise.resolve(data);
    }
}