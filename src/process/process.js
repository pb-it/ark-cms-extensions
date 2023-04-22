const rootPath = '/api/ext/process';

var id = 0;

class Process {

    _io;
    _socketUrl;
    _logfile;
    _logfileUrl;

    id;
    state;
    name;
    description;

    result;

    constructor() {
        this.id = ++id;
        this.state = 'running';
    }

    getUrl() {
        return rootPath + '/' + this.id;
    }

    setSocket(io, url) {
        this._io = io;
        this._socketUrl = url;
    }

    getSocket() {
        return this._io;
    }

    getSocketUrl() {
        return this._socketUrl;
    }

    setLogfile(file, url) {
        this._logfile = file;
        this._logfileUrl = url;
    }

    getLogfile() {
        return this._logfile;
    }

    getLogfileUrl() {
        return this._logfileUrl;
    }
}

module.exports = Process;