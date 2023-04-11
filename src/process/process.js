const rootPath = '/api/ext/process';

var id = 0;

class Process {

    _io;

    id;
    state;
    name;
    description;
    socket;
    result;

    constructor() {
        this.id = ++id;
        this.state = 'running';
    }

    getUrl() {
        return rootPath + '/' + this.id;
    }

    setSocket(url, io) {
        this.socket = url;
        this._io = io;
    }

    getSocket() {
        return this._io;
    }
}

module.exports = Process;