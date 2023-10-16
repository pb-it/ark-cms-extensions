async function init() {
    const controller = app.getController();

    const options = {
        "indent_size": "3",
        "indent_char": " ",
        "max_preserve_newlines": "5",
        "preserve_newlines": true,
        "keep_array_indentation": false,
        "break_chained_methods": false,
        "indent_scripts": "normal",
        "brace_style": "collapse",
        "space_before_conditional": true,
        "unescape_strings": false,
        "jslint_happy": false,
        "end_with_newline": false,
        "wrap_line_length": "0",
        "indent_inner_html": false,
        "comma_first": false,
        "e4x": false,
        "indent_empty_lines": false
    };

    var formatter = controller.getFormatter();
    formatter.setStyle('javascript', async function (code) {
        if (typeof js_beautify === 'undefined')
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.9/beautify.min.js");
        code = js_beautify(code, options);
        return Promise.resolve(code);
    });

    return Promise.resolve();
}

export { init };