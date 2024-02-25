class Gallery {

    static async init() {
        const entry = new ContextMenuEntry("Gallery", async function (event, target) {
            const controller = app.getController();
            try {
                const container = [];
                const obj = target.getObject();
                const model = obj.getModel();
                var objects;
                if (model.isCollection())
                    objects = obj.getAllItems();
                else {
                    const selected = app.getController().getSelectedObjects();
                    if (selected && selected.length > 0)
                        objects = selected;
                    else
                        objects = [obj];
                }
                if (objects) {
                    var media;
                    var file;
                    var dimensions;
                    var img;
                    for (var object of objects) {
                        media = model.getMedia(object);
                        if (media) {
                            file = media.getFile();
                            if (file && isImage(file)) {
                                dimensions = await Gallery.getImageDimensions(file);
                                img = {
                                    src: file,
                                    w: dimensions.width,
                                    h: dimensions.height,
                                    //title: $link.data('caption'),
                                    //alt: panel.getObject().getData()['source']
                                };
                                container.push(img);
                            }
                        }
                    }
                }
                if (container.length > 0)
                    await new Gallery().show(container);
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        });

        const controller = app.getController();
        const models = controller.getModelController().getModels();
        var entries;
        var extGroup;
        for (var model of models) {
            if (model.isCollection()) {
                entries = model.getContextMenuEntries();
                if (entries) {
                    extGroup = null;
                    for (var e of entries) {
                        if (e.getName() === 'Extensions') {
                            extGroup = e;
                            break;
                        }
                    }
                    if (extGroup)
                        extGroup.entries.push(entry);
                    else {
                        entries.unshift(new ContextMenuEntry("Extensions", null, [entry]));
                    }
                }
            }
        }
        return Promise.resolve();
    }

    static async getImageDimensions(imageSrc) {
        return new Promise(async (resolve, reject) => {
            var img = new Image();
            img.onload = function () {
                var meta = { 'width': this.width, 'height': this.height };
                resolve(meta);
            };
            img.onerror = () => { reject(); };
            img.src = imageSrc;
        });
    }

    constructor() {
    }

    async show(container, index) {
        if (typeof PhotoSwipe === 'undefined') {
            const buildUrl = "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.2/";
            await loadStyle(buildUrl + "photoswipe.min.css");
            await loadScript(buildUrl + "umd/photoswipe.umd.min.js");
        }

        const options = {
            dataSource: container,
            showHideAnimationType: 'none',
            modal: false,
            index: index
        };
        const pswp = new PhotoSwipe(options);
        pswp.init();

        return Promise.resolve();
    }
}