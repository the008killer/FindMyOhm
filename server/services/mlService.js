'use strict';

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const path     = require('path');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Send image to FastAPI ML service 
async function analyzeResistor(filePath) {
  const filename = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  const form = new FormData();
  form.append('file', fileStream, filename);

  try {
    const response = await axios.post(
      ML_SERVICE_URL + '/analyze',
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        timeout: 30000
      }
    );

    return response.data;

  } catch (error) {

    // ML service is down or unreachable
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service is not running. Start the FastAPI server.');
    }

    // ML service returned an error response
    if (error.response) {
      throw new Error(error.response.data.detail || 'ML service error');
    }

    // Request timed out
    if (error.code === 'ECONNABORTED') {
      throw new Error('ML service timed out. Try again.');
    }

    throw new Error('Failed to reach ML service');
  }
}

// Delete uploaded file after processing
function deleteFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) {
      console.error('[mlService] Could not delete file:', filePath);
    }
  });
}

module.exports = {
  analyzeResistor,
  deleteFile
};