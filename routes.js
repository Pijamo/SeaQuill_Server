const config = require('./config.json')
const mysql = require('mysql');
const e = require('express');
const { connect, param, request } = require("./server")

const connection = mysql.createConnection({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db,
    multipleStatements: true
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

// Route 1 (counties)
async function counties(req, res) {

    const page = req.query.page;
    const pagesize = req.query.pagesize ? req.query.pagesize: 10;

    const education =parseInt(req.query.education);
    const freedom = parseInt(req.query.freedom);
    const safety= parseInt(req.query.safety);
    const social =parseInt(req.query.social);
    const business = parseInt(req.query.business);
    const economic= parseInt(req.query.economic);
    const infrastructure =parseInt(req.query.infrastructure);
    const governance = parseInt(req.query.governance);
    const health= parseInt(req.query.health);
    const living = parseInt(req.query.living);
    const environment= parseInt(req.query.environment);
    const total = education + freedom + safety + social + business + economic + 
        infrastructure + governance + health + living + environment;
    
    const zip = req.query.zip;

    var create_view = `DROP VIEW IF EXISTS AdjustedScores;

    CREATE VIEW AdjustedScores(county_id, county_name, county_state, metric, adj_score) AS
(SELECT C.fips_code, C.name, C.state_id, metric, score_2021 * ${education} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Education')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${freedom} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Personal Freedom')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021 * ${safety} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Safety and Security')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${social} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Social Capital')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${business} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Business Environment')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021 * ${economic} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Economic Quality')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${infrastructure} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Infrastructure')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${governance} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Governance')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${health} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Health')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${living} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Living Conditions')

UNION

(SELECT C.fips_code, C.name, C.state_id, metric, score_2021  * ${environment} AS adj_score
FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
WHERE metric = 'Natural Environment');`;

var recommendations;
if (zip){
    recommendations = `DROP TABLE IF EXISTS Recommendations;
    CREATE TEMPORARY TABLE Recommendations
    SELECT A.county_id, A.county_name, A.county_state, SUM(adj_score) /  ${total} AS total_score
    FROM AdjustedScores A
    GROUP BY A.county_id, A.county_name, A.county_state
    HAVING total_score >= (SELECT SUM(adj_score) /  ${total} AS current_score
                            FROM AdjustedScores NATURAL JOIN Districts
                            WHERE zip = ${zip})
    ORDER BY total_score DESC;
    
    SELECT * FROM Recommendations
    LIMIT ${pagesize};`
}
else{
    recommendations = `DROP TABLE IF EXISTS Recommendations;
    CREATE TEMPORARY TABLE Recommendations
    SELECT county_id, county_name, county_state, SUM(adj_score) /  ${total} AS total_score
    FROM AdjustedScores
    GROUP BY county_id, county_name, county_state
    ORDER BY total_score DESC;
    
    SELECT * FROM Recommendations
    LIMIT ${pagesize};`
}

    connection.query(create_view + recommendations, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results[4]})
        }
    })
}


// ********************************************
//            SEARCH PAGES ROUTES
// ********************************************

//Route 2: Get Cities and States based on partially or fully completed city input

async function searchCity(req, res) {

    const city = req.query.city

    query = `SELECT DISTINCT D.city, S.name
    FROM States S JOIN Counties C ON S.id = C.state_id
    JOIN Districts D ON C.fips_code = D.county_id
    WHERE D.city LIKE '%${city}%' ;`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}

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
    hello, counties, searchCity
}