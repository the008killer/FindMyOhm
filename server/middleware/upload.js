'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

//allowed types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10 ) * 1024 * 1024;

// ensure uploads directory exists on disk automatically
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, {recursive: true})
}

// storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb){
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = uuidv4() + ext;
        cb(null, filename); 
    }
});

// file filter
function fileFilter(req, file, cb){
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)){
        cb(null, true);

    } else {
        cb(new Error('Invalid mime type. Please upload JPG, JPEG, PNG or WEBP'), false);
    }
}

//export configured multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits : {
        fileSize: MAX_FILE_SIZE
    }
});

module.exports = upload;