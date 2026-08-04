'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const analyzeRoute = require('./routes/analyze');
const { timeStamp, error } = require('console');

const app = express();
const PORT = process.env.PORT || 3001;

// middle ware
app.use(cors({
    origin:'*',
    methods:['GET','POST'],
}));

app.use(morgan('dev'));
app.use(express.json());

//static files
app.use(express.static(path.join(__dirname, '..', 'client')));

// routes
app.use('/api/analyze',analyzeRoute);

//healthcheck
app.get('/api/health', function(req,res){
    res.json({
        success:true,
        message: 'FindMyOhm is running!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use(function (req,res){
    res.status(404).json({
        success:false,
        error: 'Route not found'
    });
});

// global error handler
app.use(function (err, req, res, next){
    console.error('[SERVER ERROR]', err.message);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// start server
app.listen(PORT, function(){
    console.log('FindMyOhm Server')
    //add future
})