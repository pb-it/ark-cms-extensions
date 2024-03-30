const path = require('path');

const { Server } = require('socket.io');
const OpenAIApi = require('openai');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

class ChatGpt {

    static _instance;

    _ws;
    _io;
    _config;
    _openai;

    constructor(ws, config) {
        if (ChatGpt._instance)
            return ChatGpt._instance;
        ChatGpt._instance = this;
        this._ws = ws;
        this._config = config;

        this._ws.addExtensionRoute({
            'regex': '^/chat-gpt/configure$',
            'fn': async function (req, res, next) {
                this._config = req.body;
                const registry = controller.getRegistry();
                await registry.upsert('chatGptConfig', JSON.stringify(this._config));
                //this._init();
                controller.setRestartRequest();
                res.send('OK');
                return Promise.resolve();
            }.bind(this)
        });

        this._init();
    }

    _init() {
        if (this._config) {
            if (this._config['apiKey'])
                this._openai = new OpenAIApi({ apiKey: this._config['apiKey'] });

            this._io = new Server(this._ws.getServer(), {
                path: "/api/ext/chat-gpt/socket.io/", // -> /api/ext/chat/socket.io/socket.io.js
                cors: {
                    origin: this._config['origin'],
                    methods: ['GET', 'POST'],
                    credentials: true
                }
            });
            this._io.on('connection', (socket) => {
                //console.log('a user connected');
                socket.on('chat message', async function (msg) {
                    //console.log('message: ' + msg);
                    this._io.emit('chat message', msg);

                    if (this._openai) {
                        try {
                            var question;
                            var index = msg.indexOf(':');
                            if (index != -1 && msg.length >= index + 2)
                                question = msg.substring(index + 2);
                            console.log(question);
                            if (question) {
                                const answer = await this.answer(msg);
                                console.log(answer);
                                this._io.emit('chat message', 'ChatGPT: ' + answer);
                            }
                        } catch (error) {
                            Logger.parseError(error);
                            if (error['message'])
                                this._io.emit('chat message', 'ERROR: ' + error['message']);
                            else
                                this._io.emit('chat message', 'ERROR: Please check the server logs for further information.');
                        }
                    } else
                        this._io.emit('chat message', 'ERROR: Missing ChatGPT configuration');
                }.bind(this));

                socket.on('disconnect', () => {
                    ; //console.log('user disconnected');
                });
            });
        }
    }

    async answer(question) {
        var res;
        const completion = await this._openai.chat.completions.create({
            model: 'gpt-3.5-turbo', //model: 'gpt-4',
            messages: [{ role: 'user', content: question }],
        });
        //console.log(completion.choices[0]);
        res = completion.choices[0].message.content;
        return Promise.resolve(res);
    }

    teardown() {
        if (this._io) {
            //this._io.httpServer.close();
            this._io.close();
            this._io = null;
        }
    }
}

module.exports = ChatGpt;