'use strict';

// ── Constants ────────────────────────────────────────────────
var API_URL = 'http://localhost:3001/api/analyze';

var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

var BAND_COLOR_MAP = {
  black:  '#1a1a1a',
  brown:  '#7b3f00',
  red:    '#cc0000',
  orange: '#ff6600',
  yellow: '#ffdd00',
  green:  '#007700',
  blue:   '#0000cc',
  violet: '#7b00cc',
  grey:   '#888888',
  white:  '#f5f5f5',
  gold:   '#cfb53b',
  silver: '#aaaaaa'
};

// ── State ────────────────────────────────────────────────────
var selectedFile = null;

// ── DOM References ───────────────────────────────────────────
var dropZone         = document.getElementById('dropZone');
var fileInput        = document.getElementById('fileInput');
var previewBox       = document.getElementById('previewBox');
var previewImage     = document.getElementById('previewImage');
var fileMeta         = document.getElementById('fileMeta');
var clearBtn         = document.getElementById('clearBtn');
var analyzeBtn       = document.getElementById('analyzeBtn');
var analyzeBtnText   = document.getElementById('analyzeBtnText');
var analyzeBtnIcon   = document.getElementById('analyzeBtnIcon');
var analyzeBtnSpinner = document.getElementById('analyzeBtnSpinner');
var resultSection    = document.getElementById('resultSection');
var resultCard       = document.getElementById('resultCard');
var errorCard        = document.getElementById('errorCard');
var errorMessage     = document.getElementById('errorMessage');
var annotatedImage   = document.getElementById('annotatedImage');
var resistanceValue  = document.getElementById('resistanceValue');
var toleranceValue   = document.getElementById('toleranceValue');
var bandsTrack       = document.getElementById('bandsTrack');
var calculationText  = document.getElementById('calculationText');


// file validation
function validateFile(file){
    if (!ALLOWED_TYPES.includes(file.type)){
        return 'Invalid file type! Please upload JPG, PNG or WEBP';
    } 
    if (file.size > MAX_FILE_SIZE){
        return 'File too large! Maximum file size is 10MB';
    }
    return null;
}

// file size formatting
function formatFileSize(bytes){
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

// show image preview
function imagePreview(file){
    var error = validateFile(file);
    if (error){
        showError(error);
        return;
    }

    selectedFile = file;
    var reader = new FileReader();

    reader.onload = function (event){
        previewImage.src = event.target.result;
        fileMeta.textContent = file.name + ' . ' + formatFileSize(file.size) + ' . ' + file.type;
        previewBox.classList.add('visible');
        analyzeBtn.disabled = false;
        hideResults();
    };
    reader.readAsDataURL(file);
}

// clear all
function clearFile(){
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    fileMeta.textContent = '';
    previewBox.classList.remove('visible');
    analyzeBtn.disabled = true;
    hideResults();
}

//hide results
function hideResults(){
    resultSection.classList.remove('visible');
    resultCard.classList.remove('visible');
    errorCard.classList.remove('visible');
}

//show error card
function showError(message){
    hideResults();
    errorMessage.textContent = message;
    resultSection.classList.add('visible');
    errorCard.classList.add('visible');
    resultCard.classList.remove('visible');
}

//build band color
function renderBands(bands){
    bandsTrack.innerHTML= '';

    bands.forEach(function (colorName){
        var chip = document.createElement('div');
        chip.className='band-chip';


        var swatch = document.createElement('div');
        swatch.className = 'band-chip__swatch';
        swatch.style.backgroundColor = BAND_COLOR_MAP[colorName.toLowerCase()] || '#555';

        var label = document.createElement('span');
        label.className = 'band-chip__name';
        label.textContent = colorName;

        chip.appendChild(swatch);
        chip.appendChild(label);
        bandsTrack.appendChild(chip);
    });
}

//render full analysis results
function renderResult(data){
    if (!data){
        showError('No data returned from ML service.');
        return;
    }
    var resistors = data.resistors || (data.data && data.data.resistors) || [];
    if (!resistors || resistors.length === 0){
        showError('No resistors were detected in this image. Try another image with clearer lighting.');
        return;
    }

    var resistor = resistors[0];
    // Handle annotated image if provided
    var imageB64 = data.annotated_image || (data.data && data.data.annotated_image);
    if (imageB64) {
        annotatedImage.src = 'data:image/jpeg;base64,' + imageB64;
        annotatedImage.style.display = 'block';
    } else {
        annotatedImage.style.display = 'none';
    }

    // Adapt to both ML response schemas cleanly
    var formattedResistance = '';
    var tolerance = '';
    var bandList = [];
    var calcInfo = '';

    if (resistor.calculation && typeof resistor.calculation === 'object') {
        if (resistor.calculation.error) {
            showError('Calculation Error: ' + resistor.calculation.error);
            return;
        }
        formattedResistance = resistor.calculation.formatted || (resistor.calculation.ohms + ' Ω');
        tolerance = resistor.calculation.tolerance || '';
        bandList = resistor.bands_detected || resistor.calculation.colors || [];
        calcInfo = 'Direction: ' + (resistor.calculation.direction || 'auto') + ' • Bands: ' + bandList.join(' → ');
    } else {
        formattedResistance = (resistor.resistance || '0') + ' ' + (resistor.unit || 'Ω');
        tolerance = resistor.tolerance || '';
        bandList = resistor.bands || [];
        calcInfo = resistor.calculation || '';
    }


    resistanceValue.textContent = formattedResistance;
    toleranceValue.textContent = tolerance;
    calculationText.textContent = calcInfo;

    renderBands(bandList);

    resultSection.classList.add('visible');
    resultCard.classList.add('visible');
    errorCard.classList.remove('visible');
}

// toggle loading to button
function setLoading(isLoading){
    analyzeBtn.disabled = isLoading;
    analyzeBtnText.textContent = isLoading ? 'Analyzing....' : 'Analyze Resistor';
    analyzeBtnSpinner.hidden = !isLoading;

    if (analyzeBtnIcon){
        analyzeBtnIcon.hidden = isLoading;
    }
}

//send image to backend
async function analyzeImage(){
    if (!selectedFile) return;

    setLoading(true);
    hideResults();

    try {
        var formData = new FormData();
        formData.append('image', selectedFile);

        var response = await fetch(API_URL, {
            method : 'POST',
            body : formData
        });
        var rawText = await response.text();
        var json;

        try {
            json = JSON.parse(rawText);
        } catch (e){
            if (response.status === 405) {
                throw new Error('405 Method Not Allowed: Open the app at http://localhost:3001 (Node server) instead of Live Server (port 5500).');
            }
            throw new Error('Server returned invalid response (HTTP ' + response.status + ').');
        }

        if (!response.ok || !json.success){
            showError(json.error || (json.data && json.data.error) || 'Analysis failed. Please try again!');
            return;
        }
        renderResult(json.data);
    } catch (err){
        showError(err.message || 'Could not reach the server.');
        console.error('Fetch error: ', err);
    } finally {
        setLoading(false);
    }
}

/* Event listeners */

// click drop zone open file picker
dropZone.addEventListener('click', function(){
    fileInput.click();
});

//file selected
fileInput.addEventListener('change', function(event){
    var file = event.target.files[0];
    if (file) imagePreview(file);
});

//clear button
clearBtn.addEventListener('click', clearFile);

//analyze button
analyzeBtn.addEventListener('click', analyzeImage);

// drag over drop zone
dropZone.addEventListener('dragover', function(event){
    event.preventDefault();
    dropZone.classList.add('drag-over');
});

// drag leaves drop zone
dropZone.addEventListener('dragleave', function(){
    dropZone.classList.remove('drag-over');
});

// drop file on drop zone
dropZone.addEventListener('drop', function(event){
    event.preventDefault();
    dropZone.classList.remove('drag-over');

    var file = event.dataTransfer.files[0];
    if (file) imagePreview(file);
});



