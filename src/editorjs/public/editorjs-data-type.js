class EditorjsDataType extends DataType {

    constructor() {
        super();
        this._tag = 'editor.js';
    }

    getSkeleton(attributes) {
        var stringAttrNames;
        if (attributes) {
            var stringAttr = attributes.filter(function (x) { return (x['dataType'] === 'string' || x['dataType'] === 'text' || x['dataType'] === 'enumeration' || x['dataType'] === 'url') });
            stringAttrNames = stringAttr.map(function (x) { return { 'value': x['name'] } });
        } else
            stringAttrNames = [];

        var skeleton = [
            {
                'name': 'length',
                'dataType': 'string',
                'tooltip': '**Info**: Constraints depend on database and character encoding. Default is 255 for \'string\' and 65,535 for \'text\''
            }
        ];
        var info = controller.getApiController().getApiInfo();
        var client = info['db']['client'];
        if (client === 'mysql' || client === 'mysql2') {
            skeleton.push(
                {
                    'name': 'charEncoding',
                    'label': 'Encoding',
                    'tooltip': `**Info**: The default character encoding for the column will be taken from its table.`,
                    'dataType': 'enumeration',
                    'options': [
                        { 'value': 'default' },
                        { 'value': 'latin1' },
                        { 'value': 'utf8' },
                        { 'value': 'utf8mb4' }
                    ],
                    'view': 'select'
                }
            );
        }
        skeleton.push(
            { 'name': 'size', 'dataType': 'string' },
            { 'name': 'defaultValue', 'dataType': 'string' }
        );
        return skeleton;
    }

    getFormEntryClass() {
        return EditorjsFormEntry;
    }

    async renderView($value, attribute, data) {
        try {
            const value = data[attribute['name']];
            if (value) {
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
                const $editor = $('<div/>')
                    .attr('id', 'editorjs')
                    .css({
                        'border': '1px solid gray',
                        'background': '#FFFFFF'
                    });
                $value.append($editor);

                this._observer = EditorjsFormEntry.createObserver('body', '#editorjs', function (element) {
                    const editor = new EditorJS({
                        holder: 'editorjs',
                        data: JSON.parse(value),
                        readOnly: true,
                        tools: {
                            header: {
                                class: Header,
                                inlineToolbar: ['marker', 'link'],
                                config: {
                                    placeholder: 'Header'
                                },
                                shortcut: 'CMD+SHIFT+H'
                            },

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
            }
        } catch (error) {
            $value.html("&lt;ERROR&gt;");
            app.getController().showError(error);
        }
        return Promise.resolve();
    }
}