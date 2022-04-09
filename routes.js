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


// Route 0 (test)
async function hello(req, res) {
    // a GET request to /hello?name=Steve
    if (req.query.name) {
        var string = `Hello, ${req.query.name}! Welcome to the SeaQuill server!`
        console.log(string)
        res.send(string)
    } else {
        var string = `Hello! Welcome to the SeaQuill server test2!`
        console.log(string)
        res.send(string)
    }
}


// Route (test)
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

// Route 1 (getCounties)
async function getCounties(req, res) {

}


// ********************************************
//            SEARCH PAGES ROUTES
// ********************************************

//Route 2: Get State List


//Route 3: Get property List


// ********************************************
//            LISTINGS PAGES ROUTES
// ********************************************
//Route 4: Get Property List Based on Filter
//Route 5: Fresh Api call based on Page No.


//LISTINGS DETAILS
//ROUTE 6: CALL API for Details of Listings


// ********************************************
//            QUIZ ROUTES
// ********************************************
//ROUTE 6: Call to Server for Prosperity Index
//Value: Prosperity Index Array
//Return: List of counties


module.exports = {
    hello,
    test
}