const config = require('./config.json')
const mysql = require('mysql');
const e = require('express');


// ********************************************
//            SIMPLE ROUTE EXAMPLE
// ********************************************

// Route 1 (handler)
async function hello(req, res) {
    // a GET request to /hello?name=Steve
    if (req.query.name) {
        res.send(`Hello, ${req.query.name}! Welcome to the SeaQuill server!`)
    } else {
        res.send(`Hello! Welcome to the SeaQuill server!`)
    }
}


module.exports = {
    hello
}