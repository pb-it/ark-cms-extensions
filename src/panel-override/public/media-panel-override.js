class MediaPanelOverride extends CrudPanelOverride {

    _media;

    _thumbnail;
    _fileSelect;

    constructor(config, obj) {
        super(config, obj);
    }

    getClass() {
        return MediaPanel;
    }

    async _init() {
        const model = this._obj.getModel();
        this._media = model.getMedia(this._obj);
        this._thumbnail = new Thumbnail(this._config, this._media, this._bLazy);
        return super._init();
    }

    async _renderContent() {
        var $div = $('<div/>');
        this._fileSelect = undefined;
        if ((this._config.action == ActionEnum.create || this._config.action == ActionEnum.update) && (!this._media || !this._media.getThumbnail()))
            $div.append(this._renderFileSelect());
        else
            $div.append(await this._thumbnail.renderThumbnail());

        var $d = await super._renderContent();
        if ($d) {
            if (this._config.action != ActionEnum.create && this._config.action != ActionEnum.update && (!this._config['details'] || this._config['details'] === DetailsEnum.title))
                $d.css({
                    "clear": "left",
                    "max-width": this._config.width,
                    "text-align": "center"
                });
            else
                $d.css({ 'display': 'inline-block' });
            $div.append($d);

            $d = $('<div/>').addClass('clear'); // if form shorter than thumbnail
            $div.append($d);
        }
        return Promise.resolve($div);
    }

    _renderFileSelect() {
        this._fileSelect = new FileSelect();
        var $fileSelect = this._fileSelect.renderFileSelect();
        $fileSelect.css({
            "float": "left",
            "max-width": "40%"
        });
        return $fileSelect;
    }

    async _readData(bValidate) {
        var data = await super._readData(bValidate);
        if (this._fileSelect) {
            data = await this._addSelectedFile(data);
        }
        return Promise.resolve(data);
    }

    async _addSelectedFile(data) {
        var file = await this._fileSelect.getSelectedFile();
        if (file) {
            var prop;
            var model = this._obj.getModel();
            var p = model.getModelDefaultsController().getDefaultThumbnailProperty();
            var bUrl = false;
            var bConvert = true;
            if (p) {
                var mac = model.getModelAttributesController();
                if (file.startsWith("http")) {
                    bUrl = true;
                    if (p.indexOf(';') == -1) {
                        var attr = mac.getAttribute(p);
                        if (attr && attr['dataType'] === "url")
                            prop = p;
                    } else {
                        var attr;
                        var name;
                        var parts = p.split(';');
                        for (var i = parts.length - 1; i >= 0; i--) {
                            name = parts[i];
                            attr = mac.getAttribute(name);
                            if (attr && attr['dataType'] === "url") {
                                prop = name;
                                break;
                            }
                        }
                    }
                    if (!prop)
                        bConvert = true;
                }
                if (file.startsWith("data:") || bConvert) {
                    if (p.indexOf(';') == -1) {
                        var attr = mac.getAttribute(p);
                        if (attr && attr['dataType'] === "file")
                            prop = p;
                    } else {
                        var attr;
                        var name;
                        var parts = p.split(';');
                        for (var i = parts.length - 1; i >= 0; i--) {
                            name = parts[i];
                            attr = mac.getAttribute(name);
                            if (attr && attr['dataType'] === "file") {
                                prop = name;
                                break;
                            }
                        }
                    }
                }
            }
            if (prop) {
                if (bUrl) {
                    if (bConvert) {
                        var blob = await HttpClient.request('GET', file, { 'responseType': 'blob' });
                        data[prop] = { 'base64': await Base64.encodeObject(blob) };
                    } else
                        data[prop] = file;
                } else
                    data[prop] = { 'base64': file };
            } else
                throw new Error("no matching thumbnail attribute defined");
        }
        return Promise.resolve(data);
    }

    _dblclick() {
        var model = this._obj.getModel();
        var action = model.getDoubleClickAction();
        if (action)
            action(this);
        else
            this.openThumbnail();
    }

    async openThumbnail() {
        const controller = app.getController();
        controller.setLoadingState(true);

        const thumbnail = new Thumbnail({}, this._media);
        const $thumbnail = await thumbnail.renderThumbnail();

        const modal = controller.getModalController().addModal();
        modal.open($thumbnail);

        controller.setLoadingState(false);
        return Promise.resolve();
    }

    getThumbnail() {
        return this._thumbnail;
    }
}