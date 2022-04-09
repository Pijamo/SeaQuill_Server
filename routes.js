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
        var string = `Hello, ${req.query.name}! Welcome to the SeaQuill server!`
        console.log(string)
        res.send(string)
    } else {
        var string = `Hello! Welcome to the SeaQuill server test!`
        console.log(string)
        res.send(string)
    }
}


// Route 2 (test)
async function test(req, res) {

    var query2 = `SELECT *
    FROM States
    `

    connection.query(query2, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}


module.exports = {
    hello,
    test
}