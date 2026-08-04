'use strict';

// ── Constants ────────────────────────────────────────────────
var API_URL       = 'http://localhost:3001/api/analyze';
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
    var resistor = data.resistors[0];

    if (data.annotated_image){
        annotatedImage.src = 'data:image/jpeg;base64,'+data.annotated_image;
        annotatedImage.style.display = 'block';
    } else {
        annotatedImage.style.display = 'none';
    }

    resistanceValue.textContent = resistor.resistance + ' ' + resistor.unit;
    toleranceValue.textContent = resistor.tolerance;
    calculationText.textContent = resistor.calculation;

    renderBands(resistor.bands);

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
        var json = await response.json();

        if (!response.ok || !json.success){
            showError(json.error || 'Analysis failed. Please try again!');
            return;
        }
        renderResult(json.data);
    } catch (err){
        showError('Could not reach the server.');
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



