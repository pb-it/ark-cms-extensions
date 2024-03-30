class ChatGptPanel extends Panel {

    _socket;
    _user;

    _$messages;
    _$form;
    _$input;

    constructor() {
        super();
    }

    async _init() {
        await super._init();

        const controller = app.getController();

        const user = controller.getAuthController().getUser();
        if (user)
            this._user = user['username'];
        if (!this._user)
            this._user = 'anonymous';

        const apiController = controller.getApiController();
        const url = apiController.getApiOrigin();
        this._socket = io(url, {
            path: '/api/ext/chat-gpt/socket.io/',
            withCredentials: true
        });

        this._socket.on('connect', () => {
            console.log('connected'); // alert('connect');
        });

        this._socket.on('connect_error', function () {
            alert('error');
            this._socket.connect();
        }.bind(this));

        this._socket.on('chat message', function (msg) {
            const item = document.createElement('li');
            item.textContent = msg;
            this._$messages[0].appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        }.bind(this));

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({
                'padding': '10',
                'min-width': '500px',
                'min-height': '300px',
            });

        this._$messages = $('<ul>')
            .attr('id', 'messages');
        $div.append(this._$messages);

        this._$form = $('<form>')
            .attr('id', 'form')
            .submit(async function (event) {
                event.preventDefault();
                //event.stopPropagation();

                const val = this._$input.val();
                if (val) {
                    this._socket.emit('chat message', this._user + ': ' + val);
                    this._$input.val('');
                }

                return Promise.resolve();
            }.bind(this));
        this._$input = $('<input>')
            .attr('id', 'input')
            .attr('autocomplete', 'off');
        this._$form.append(this._$input);
        const button = $('<button>')
            .text('Send');
        this._$form.append(button);
        $div.append(this._$form);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    dispose() {
        this._socket.disconnect();
        return super.dispose();
    }
}