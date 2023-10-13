class ConsolePanel extends Panel {

    static async _loadPrettifier() {
        var buildUrl = "https://unpkg.com/prettier@2.7.1/";
        var p1 = loadScript(buildUrl + "standalone.js");
        var p2 = loadScript(buildUrl + "parser-html.js");
        var p3 = loadScript(buildUrl + "parser-babel.js");
        return Promise.all([p1, p2, p3]);
    }

    static async _format(response, format) {
        if (typeof response === 'string' || response instanceof String) {
            if (format) {
                if (format == 'auto') {
                    if ((response.startsWith('{') && response.endsWith('}')) ||
                        (response.startsWith('[') && response.endsWith(']')))
                        format = 'json';
                    else if ((response.startsWith('<?xml version="1.0" ?>') ||
                        response.startsWith('<!DOCTYPE html') ||
                        response.startsWith('<html')) &&
                        response.trimEnd().endsWith('</html>'))
                        format = 'html';
                }
                switch (format) {
                    case 'json':
                        response = JSON.stringify(JSON.parse(response), null, '\t');
                        break;
                    case 'html':
                        if (typeof prettier === 'undefined')
                            await ConsolePanel._loadPrettifier();
                        response = prettier.format(response, {
                            parser: 'html',
                            plugins: prettierPlugins,
                            tabWidth: 3
                        });
                        break;
                    default:
                }
            }
        } else
            response = JSON.stringify(response, null, '\t');
        return Promise.resolve(response);
    }

    _snippets;
    _console;
    _output;

    _$name;
    _$input;
    _$output;
    _$console
    _$oFormat;

    constructor() {
        super();

        var snippets = app.getController().getStorageController().loadLocal('snippets');
        if (snippets)
            this._snippets = JSON.parse(snippets);
        else
            this._snippets = {};

        var xconsole = {};
        xconsole.log = this._log.bind(this);
        xconsole.info = console.info;
        xconsole.warn = console.warn;
        xconsole.error = console.error;
        this._console = xconsole;
    }

    async _init() {
        await super._init();
        return Promise.resolve();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var $loadDiv = $('<div/>');
        var $input = $('<select/>');
        var $option = $('<option/>', { value: '' }).text('undefined');
        //$option.prop('selected', true);
        $input.append($option);
        for (const [key, value] of Object.entries(this._snippets)) {
            $option = $('<option/>', { 'value': value }).text(key);
            $input.append($option);
        }
        $input.on("change", function (event) {
            var select = event.target;
            var index = select['selectedIndex'];
            var options = select['options'];
            var name = options[index]['text'];
            this._$name.val(name);
            this._$input.val(select.value);
        }.bind(this));
        $loadDiv.append($input);
        this._$name = $('<input/>')
            .attr('type', 'text')
            .attr('size', 40);
        $loadDiv.append(this._$name);
        var $save = $('<button>')
            .text('Save')
            .click(async function (event) {
                event.stopPropagation();

                //TODO:
                //alert("NotImplementedException");

                var name = this._$name.val();
                if (name) {
                    if (!this._snippets[name] || confirm('Override \'' + name + '\'?')) {
                        this._snippets[name] = this._$input.val();
                        var str = JSON.stringify(this._snippets);
                        console.log(str);
                        app.getController().getStorageController().storeLocal('snippets', str);
                        alert('Saved!');
                    }
                } else
                    alert('Name required!');

                return Promise.resolve();
            }.bind(this));
        $loadDiv.append($save);
        $div.append($loadDiv);

        var $leftDiv = $('<div/>')
            .css({ display: 'inline-block' });
        this._$input = $('<textarea/>')
            .attr('rows', 40)
            .attr('cols', 100)
            .val('await sleep(1000);\nreturn Promise.resolve(\'123\');');
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
        $leftDiv.append(this._$input);
        $leftDiv.append('<br />');

        var $run = $('<button>')
            .text('Run')
            .click(async function (event) {
                event.stopPropagation();

                try {
                    app.controller.setLoadingState(true);
                    var code = this._$input.val();
                    //eval(code);

                    this._$console.val('');

                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    this._output = await new AsyncFunction('console', code).bind(this, this._console)();
                    var output;
                    if (this._output) {
                        var oFormat = this._$oFormat.val();
                        output = await ConsolePanel._format(this._output, oFormat);
                    }
                    this._$output.val(output);
                    app.controller.setLoadingState(false);
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $leftDiv.append($run);

        var $format = $('<button>')
            .text('Format')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                if (typeof prettier === 'undefined')
                    await ConsolePanel._loadPrettifier();
                var pretty = prettier.format(this._$input.val(), {
                    parser: 'babel',
                    plugins: prettierPlugins,
                    tabWidth: 3
                });
                this._$input.val(pretty);

                return Promise.resolve();
            }.bind(this));
        $leftDiv.append($format);
        $div.append($leftDiv);

        var $rightDiv = $('<div/>')
            .css({
                'display': 'inline-block',
                'vertical-align': 'top'
            });
        $rightDiv.append('Console:<br>');
        this._$console = $('<textarea/>')
            .attr('rows', 5)
            .attr('cols', 100)
            .prop("disabled", true);
        $rightDiv.append(this._$console);
        $rightDiv.append('<br><br>');
        $rightDiv.append('Output Format: ');
        this._$oFormat = $('<select/>');
        var options = ['auto', 'text', 'json', 'html'];
        var $option;
        //$option = $('<option/>', { value: '' }).text('undefined');
        //$option.prop('selected', true);
        //this._$oFormat.append($option);
        for (var option of options) {
            $option = $('<option/>', { value: option }).text(option);
            this._$oFormat.append($option);
        }
        this._$oFormat.on("change", async function (event) {
            try {
                app.controller.setLoadingState(true);
                var output = await ConsolePanel._format(this._output, event.target.value);
                this._$output.val(output);
                app.controller.setLoadingState(false);
            } catch (error) {
                app.controller.setLoadingState(false);
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));
        $rightDiv.append(this._$oFormat);
        $rightDiv.append('<br />');

        this._$output = $('<textarea/>')
            .attr('rows', 30)
            .attr('cols', 100)
            .prop("disabled", true);
        $rightDiv.append(this._$output);
        $rightDiv.append('<br />');

        var $copy = $('<button>')
            .text('Copy Result to Clipboard')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(this._$output.val());
                } else {
                    this._$output.focus();
                    this._$output.select();
                    try {
                        this._$output.execCommand('copy');
                    } catch (error) {
                        console.error(error);
                    }
                }

                return Promise.resolve();
            }.bind(this));
        $rightDiv.append($copy);

        var $saveFile = $('<button>')
            .text('Save to File')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                FileCreator.createFileFromText('output.txt', this._$output.val());

                return Promise.resolve();
            }.bind(this));
        $rightDiv.append($saveFile);

        $div.append($rightDiv);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    _log(x) {
        var val = this._$console.val()
        this._$console.val(val + x + '\n');
    }
}