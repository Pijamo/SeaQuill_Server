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

// ********************************************
//            QUIZ ROUTES
// ********************************************
//ROUTE 1: County Recommendations

async function counties(req, res) {

    const page = req.query.page;
    const pagesize = req.query.pagesize ? req.query.pagesize: 10;

    var offset;
    if (page && !isNaN(page)){
        offset = (page -1) * pagesize
    }
    else{
        offset = 0
    }


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
    LIMIT ${offset}, ${pagesize};`
}
else{
    recommendations = `DROP TABLE IF EXISTS Recommendations;
    CREATE TEMPORARY TABLE Recommendations
    SELECT county_id, county_name, county_state, SUM(adj_score) /  ${total} AS total_score
    FROM AdjustedScores
    GROUP BY county_id, county_name, county_state
    ORDER BY total_score DESC;
    
    SELECT * FROM Recommendations
    LIMIT ${offset}, ${pagesize};`
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
//            QUIZ RESULT ROUTES
// ********************************************

//Route 2: Returns a list of cities in the selected county, filtered by user preference for city size
async function cities(req, res) {
    const popUpper= req.query.popUpper ? req.query.popUpper: 50000
    const popLower = req.query.popLower ? req.query.popLower: 0
    const region = req.query.region ? req.query.region : [0,1,2,3,4]
    const county = req.query.region
    if (county){

    }



    query = `SELECT D.city, S.name as State, D.zip, D.pop_density, R.total_score
    FROM Districts D JOIN Counties C ON D.county_id = C.fips_code
    JOIN States S ON S.id = C.state_id
    JOIN Recommendations R on R.county_id = D.county_id
    WHERE D.pop_density > ${popLower} 
    AND D.pop_density < ${popUpper}
    AND S.region_id IN (${region})  
    ORDER BY D.pop_density DESC;`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}

//Route 3: Returns climate information for the selected county
async function climate(req, res) {
    const county = req.query.county;

    
    query = `SELECT county_id, month, AVG(temp_avg), AVG(temp_min), AVG(temp_max),
    AVG(rain_days) as total_rain, AVG(snow_days) as total_snow
    FROM Climate C JOIN Weather_Stations W ON C.station_id = W.id
    WHERE county_id = ${county}
    GROUP BY county_id, month;`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}

//Route 4: Returns job information for the selected county
async function jobs(req, res) {
    const county = req.query.county;
    const keyword = req.query.keyword;

    query = `SELECT title, total_jobs, mean_salary, location_quotient
                FROM Employment E JOIN Jobs J ON E.job_code = J.code
                JOIN CountiesInOccZone C ON C.occ_zone = E.occ_zone
                WHERE county_id = ${county} AND
                title LIKE '%${keyword}%'
                LIMIT 10;`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}

// ********************************************
//            LISTING SEARCH PAGE ROUTES
// ********************************************

//Route 5: Get Cities and States based on partially or fully completed city input

async function cityState(req, res) {

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

// ********************************************
//            User Routes
// ********************************************
//Route 6: Retrieve user credentials from Users database upon login
async function users(req, res) {
    
    const email = req.query.email
    const password = req.query.password

    query = `SELECT first_name, last_name, zip
    FROM Users
    WHERE email = '${email}' AND password = SHA1('${password}');`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}
//Route 7: Add user credentials to Users database
async function addUser(req, res) {
    
    const email = req.query.email
    const password = req.query.password
    const firstName = req.query.firstName
    const lastName = req.query.lastName
    const gender = req.query.gender
    const dob = req.query.dob ? req.query.dob: 'NULL'
    const zip = req.query.zip ? req.query.zip: 'NULL'

    query = `INSERT INTO Users
    VALUES ('${email}', '${firstName}', '${lastName}', SHA1('${password}'), '${gender}', ${dob}, ${zip});`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            if (error.errno == 1062){
                res.send('An account is already associated with this email address.')
            }
        } else {
            console.log("Added entry to User database")
        }
    })
}

// ********************************************
//            Favorites Routes
// ********************************************
//Route 8: Retrieve favorite county for user from Favorites database
async function favorites(req, res) {
    
    const email = req.query.email

    query = `SELECT C.name as County, S.name as State
    FROM Favorites F JOIN Counties C ON F.county_id = C.fips_code
    JOIN States S ON C.state_id = S.id
    WHERE user_id = '${email}';`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
        }
    })
}
//Route 9: Add favorite county to Favorites database
async function modifyFavorites(req, res) {
    const email = req.query.email 
    const county = req.query.county
    const action = req.params.action

    if (action === 'add'){
        query = `INSERT INTO Favorites
        VALUES ('${email}', '${county}');`
    }
    else if(action === 'delete'){
        query = `DELETE FROM Favorites
        WHERE user_id='${email}' AND county_id = ${county};`
    }

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            if (error.errno == 1062){
                res.send('County is already in favorites!')
            }
        } else {
            console.log("Added or removed entry from Favorites database")
        }
    })
}

// ********************************************
//            LISTINGS PAGES ROUTES
// ********************************************
//Route : Get Property List Based on Filter
//Route : Fresh Api call based on Page No.


module.exports = {
    counties, cityState, cities, climate, jobs,users, addUser,favorites, modifyFavorites
}