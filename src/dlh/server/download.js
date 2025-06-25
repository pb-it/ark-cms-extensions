const path = require('path');
const fs = require('fs');

const State = {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    FAILURE: 'FAILURE',
    FINISHED: 'FINISHED'
};

class Download {

    _id;
    _url;
    _folder;
    _filename;
    _file;
    _client;
    _options;
    _logfile;
    _state;

    constructor(id, url, folder, filename, client, options, logfile) {
        this._id = id;
        this._url = url;
        this._folder = folder;
        this._filename = filename;
        this._client = client;
        this._options = options;
        this._logfile = logfile;

        this._state = State.PENDING;

        /*this._options = {
            //format: 'mp4'
            filter: 'audioandvideo',
            quality: 'highestvideo',
            requestOptions: {
                headers: {
                    'cookie': "CONSENT=PENDING+094;",
                    'x-youtube-identity-token': "QUFFLUhqbFVIODVJWkY5TnZwV1hsb19ua0NiUjJWX2tBZ3w="
                }
            }
        };*/
    }

    start() {
        this._state = State.RUNNING;

        var file;
        var filename;
        if (this._filename)
            filename = this._filename;
        else
            filename = this._id;
        file = path.join(this._folder, filename);

        this._client.download(this._url, file, this._options, this._logfile)
            .then(file => {
                this._file = file;
                this._state = State.FINISHED;
            })
            .catch(error => {
                console.error(error);
                if (file && fs.existsSync(file))
                    fs.unlinkSync(file);
                var msg;
                if (typeof error === 'string' || error instanceof String)
                    msg = error;
                else if (error.message)
                    msg = error.message;
                fs.writeFileSync(this._logfile, msg);
                this._state = State.FAILURE;
            });
    }

    setOptions(options) {
        this._options = options;
    }

    getId() {
        return this._id;
    }

    getData() {
        const data = {
            'id': this._id,
            'state': this._state,
            'url': this._url,
            'file': this._file
        };
        if (this._logfile && fs.existsSync(this._logfile))
            data['logfile'] = this._logfile;
        return data;
    }
}

module.exports = Download;