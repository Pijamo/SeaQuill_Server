const config = require('./config.json')
const mysql = require('mysql');
const e = require('express');
const { connect, param } = require("./server")

const connection = mysql.createConnection({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db
});
connection.connect();

// Route 1 (test)
async function hello(req, res) {
    // a GET request to /hello?name=Steve
    if (req.query.name) {
        res.send(`Hello, ${req.query.name}! Welcome to the SeaQuill server!`)
    } else {
        res.send(`Hello! Welcome to the SeaQuill server!`)
    }
}

// Route 2 (test)
async function test(req, res) {

    var query = `
    SELECT *
    FROM States
    `

    connection.query(query, function(err, results, fields) {
        if (err) console.log(err);
        else {
            res.json({ results: results })
        }
        })
}


module.exports = {
    hello
}