'use strict';

const express = require('express');
const router = express.Router();
const upload   = require('../middleware/upload');
const mlService = require('../services/mlService');

// POST /api/analyze

router.post('/', upload.single('image'), async function (req, res){

    if(!req.file){
        return res.status(400).json({
            success: false,
            error: 'No image file provided'
        });
    }

    const filePath = req.file.path;

    try {
        console.log('[Analyze] Received file:', req.file.originalname);
        console.log('[Analyze] Saved as:', req.file.filename);
        console.log('[Analyze] Forwarding to ML service...');

        const result = await mlService.analyzeResistor(filePath);

        console.log('[Analyze] ML service responded successfully');

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('Analyze error', err.message);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        mlService.deleteFile(filePath);
    }
});


//multer error handler
router.use(function (err, req, res, next){
    if (err.code === 'LIMIT_FILE_SIZE'){
        return res.status(400).json({
            success: false,
            error: 'File too large. Maximum file size is 10MB'
        }); 
    }

    if (err.message){
        return res.status(400).json({
            success: false,
        error: err.message
        });
    }

    next(err);
});

module.exports= router;