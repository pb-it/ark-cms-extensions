class SshClientPanel extends Panel {

    _socket;
    _bConnected;

    _configForm;
    _$config;

    _$terminal;
    _$messages;
    _$input;
    _$form;

    constructor() {
        super();
    }

    async _init() {
        await super._init();
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        this._$config = $('<div/>');
        await this._renderConfigForm();
        $div.append(this._$config);

        this._$terminal = $('<div/>');
        await this._renderTerminal();
        $div.append(this._$terminal);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _renderConfigForm() {
        this._$config.empty();

        if (this._socket) {
            const $disconnect = $('<button>')
                .text('Disconnect')
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    await this.disconnect();

                    return Promise.resolve();
                }.bind(this));
            this._$config.append($disconnect);
        } else {
            const skeleton = [
                {
                    name: 'host',
                    dataType: 'string',
                    required: true
                },
                {
                    name: 'port',
                    dataType: 'integer',
                    defaultValue: 22
                },
                {
                    name: 'username',
                    dataType: 'string',
                    required: true
                },
                {
                    name: 'password',
                    dataType: 'string',
                    type: 'password',
                    required: true
                }
            ];
            /*const data = {
                'host': '192.168.0.1',
                'username': 'user',
                'password': '******'
            };*/
            const data = {};
            this._configForm = new Form(skeleton, data);
            this._$config.append(await this._configForm.renderForm());

            const $connect = $('<button>')
                .text('Connect')
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    await this.connect();

                    return Promise.resolve();
                }.bind(this));
            this._$config.append($connect);
        }

        return Promise.resolve();
    }

    async _renderTerminal() {
        this._$terminal.empty();

        if (this._socket) {
            this._$messages = $('<ul>')
                .attr('id', 'messages');
            this._$terminal.append(this._$messages);

            this._$form = $('<form>')
                .attr('id', 'form')
                .submit(async function (event) {
                    event.preventDefault();
                    //event.stopPropagation();

                    const val = this._$input.val();
                    if (val) {
                        this._socket.emit('chat message', val);
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
            this._$terminal.append(this._$form);

            /*const $submit = $('<button>')
                .text('Submit')
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const ac = app.getController().getApiController();
                    const client = ac.getApiClient();
                    var data = {
                        'host': '192.168.0.1',
                        'username': 'user',
                        'password': '******',
                        'cmd': 'uptime'
                    };
                    var tmp = await client.request('POST', '/api/ext/ssh-client/execute', null, data);
                    if (tmp !== 'OK')
                        throw new Error('Switching WebClient Failed');

                    return Promise.resolve();
                }.bind(this));
            this._$terminal.append($submit);*/
        }

        return Promise.resolve();
    }

    dispose() {
        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
        }
        return super.dispose();
    }

    async connect() {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);
            await this._connect();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }

        await this._renderConfigForm();
        await this._renderTerminal();

        return Promise.resolve();
    }

    async _connect() {
        return new Promise((resolve, reject) => {
            const controller = app.getController();
            const apiController = controller.getApiController();
            const url = apiController.getApiOrigin();
            this._socket = io(url, {
                path: '/api/ext/ssh-client/socket.io/',
                //withCredentials: true
            });
            //this._socket.connet();

            this._socket.on('connect', async () => {
                //console.log('connected');
                const param = await this._configForm.readForm();
                this._socket.emit('param', param);
                resolve();
            });

            this._socket.on('connect_error', function () {
                alert('error');
                this._socket = null;
                reject();
            }.bind(this));

            this._socket.on('chat message', function (msg) {
                const item = document.createElement('li');
                item.textContent = msg;
                this._$messages[0].appendChild(item);
                window.scrollTo(0, document.body.scrollHeight);
            }.bind(this));
        });
    }

    async disconnect() {
        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
        }

        await this._renderConfigForm();
        await this._renderTerminal();

        return Promise.resolve();
    }
}