const SSD_MOBILENETV1 = 'ssd_mobilenetv1';
const TINY_FACE_DETECTOR = 'tiny_face_detector';

let selectedFaceDetector = TINY_FACE_DETECTOR;

// ssd_mobilenetv1 options
let minConfidence = 0.5;

// tiny_face_detector options
let inputSize = 512;
let scoreThreshold = 0.5;

function getFaceDetectorOptions() {
    return selectedFaceDetector === SSD_MOBILENETV1
        ? new faceapi.SsdMobilenetv1Options({ minConfidence })
        : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function getCurrentFaceDetectionNet() {
    if (selectedFaceDetector === SSD_MOBILENETV1) {
        return faceapi.nets.ssdMobilenetv1
    }
    if (selectedFaceDetector === TINY_FACE_DETECTOR) {
        return faceapi.nets.tinyFaceDetector
    }
}

function isFaceDetectionModelLoaded() {
    return !!getCurrentFaceDetectionNet().params
}

async function runFaceDetection() {
    const inputImgEl = $('#refImg').get(0);
    const canvas = $('#refImgOverlay').get(0);

    var origin;
    if (typeof app !== 'undefined') {
        const controller = app.getController();
        const apiController = controller.getApiController();
        origin = apiController.getApiOrigin();
    }
    const MODEL_URI = `${origin ? origin : ''}/api/ext/face-recognition/public/weights/`;
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URI),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URI),
    ]);

    /*await Promise.all([
        faceapi.loadSsdMobilenetv1Model(MODEL_URI),
        faceapi.loadTinyFaceDetectorModel(MODEL_URI),
        faceapi.loadFaceLandmarkModel(MODEL_URI), // model to detect face landmark
        faceapi.loadFaceRecognitionModel(MODEL_URI), //model to Recognise Face
        faceapi.loadFaceExpressionModel(MODEL_URI) //model to detect face expression
    ]);*/
    /*if (!isFaceDetectionModelLoaded())
        await getCurrentFaceDetectionNet().load(MODEL_URI)*/

    var resizedResults;
    const fullFaceDescriptions = await faceapi
        .detectAllFaces(inputImgEl, getFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();
    if (fullFaceDescriptions.length > 0) {
        var faceMatcher = new faceapi.FaceMatcher(fullFaceDescriptions);
        faceapi.matchDimensions(canvas, inputImgEl);
        resizedResults = faceapi.resizeResults(fullFaceDescriptions, inputImgEl);
        const labels = faceMatcher.labeledDescriptors
            .map(ld => ld.label);
        //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedResults); //to draw box around detection
        faceapi.draw.drawFaceLandmarks(canvas, resizedResults); //to draw face landmarks
        faceapi.draw.drawFaceExpressions(canvas, resizedResults); //to mention face expression
        //faceapi.draw.drawAge(canvas, agage_gender_model);
        /*resizedResults.forEach(({ detection, descriptor, age, gender }) => {
            const label = faceMatcher.findBestMatch(descriptor).toString();
            //const label = Math.round(age) + " year old " + gender;
            const drawBox = new faceapi.draw.DrawBox(detection.box, { label });
            drawBox.draw(canvas);
        });*/
        resizedResults.forEach(result => {
            const { age, gender, genderProbability } = result;
            new faceapi.draw.DrawTextField(
                [
                    `${Math.round(age, 0)} years`,
                    `${gender} (${Math.round(genderProbability)})`
                ],
                result.detection.box.bottomRight
            ).draw(canvas);
        });
    }
    return Promise.resolve();
}

class FaceRecognition {

    static async init() {
        const entry = new ContextMenuEntry("Face Recognition", async function (event, target) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                var selected;
                const sc = controller.getSelectionController();
                if (sc)
                    selected = sc.getSelected();
                if (!selected || selected.length == 0 || (selected.length == 1 && selected[0] == target)) {
                    if (typeof faceapi === 'undefined')
                        await loadScript("https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.js");

                    const obj = target.getObject();
                    const model = obj.getModel();
                    const media = model.getMedia(obj);

                    const $div = $('<div/>')
                        .css({
                            'position': 'relative'
                        });
                    const $img = $('<img/>')
                        .attr({
                            'id': 'refImg',
                            'src': media.getThumbnail(),
                            'crossorigin': 'use-credentials'
                        });
                    $div.append($img);
                    const $canvas = $('<canvas/>')
                        .attr({
                            'id': 'refImgOverlay',
                            'class': 'overlay'
                        })
                        .css({
                            'position': 'absolute',
                            'top': '0px',
                            'left': '0px'
                        });
                    $div.append($canvas);

                    var modal = controller.getModalController().addModal();
                    modal.open($div);

                    await runFaceDetection();
                }
            } catch (error) {
                controller.showError(error);
            } finally {
                controller.setLoadingState(false);
            }
            return Promise.resolve();
        });
        entry.setVisibilityFunction(function (target) {
            const obj = target.getObject();
            const model = obj.getModel();
            return model.getMedia(obj);
        });

        const controller = app.getController();
        const models = controller.getModelController().getModels();
        var entries;
        var extGroup;
        for (var model of models) {
            if (model.getModelDefaultsController().getDefaultMediaTypeProperty()) {
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
                        extGroup = new ContextMenuEntry('Extensions', null, [entry]);
                        extGroup.setIcon(new Icon('puzzle-piece'));
                        entries.unshift(extGroup);
                    }
                }
            }
        }
        return Promise.resolve();
    }
}