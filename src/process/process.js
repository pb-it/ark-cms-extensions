const path = require('path');
const fs = require('fs');

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

    getData() {
        var data = {
            id: this['id'],
            state: this['state']
        }
        if (this['name'])
            data['name'] = this['name'];
        if (this['description'])
            data['description'] = this['description'];
        if (this['result'])
            data['result'] = this['result'];
        data['url'] = this.getUrl();
        var socketUrl = this.getSocketUrl();
        if (socketUrl)
            data['socket'] = socketUrl;
        var logfileUrl = this.getLogfileUrl();
        if (logfileUrl && fs.existsSync(path.join(__dirname, logfileUrl)))
            data['logfile'] = logfileUrl;
        return data;
    }
}

module.exports = Process;