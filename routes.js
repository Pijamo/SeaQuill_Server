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

    const page = req.query.page && !isNaN(req.query.page) ? req.query.page : 1;
    const pagesize = req.query.pagesize && !isNaN(req.query.pagesize) ? req.query.pagesize: 10;
    var offset = (page -1) * pagesize

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
    
    const zip = req.query.zip && !isNaN(req.query.zip) ? req.query.zip: 0;

    var create_temp = `DROP TABLE IF EXISTS AdjustedScores;
    CREATE TEMPORARY TABLE AdjustedScores
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${education} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Education')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${freedom} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Personal Freedom')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${safety} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Safety and Security')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${social} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Social Capital')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${business} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Business Environment')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${economic} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Economic Quality')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${infrastructure} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Infrastructure')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${governance} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Governance')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${health} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Health')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${living} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Living Conditions')
    
    UNION
    
    (SELECT C.fips_code, C.name, C.state_id, metric, score_2021, ${environment} AS ranking
    FROM Prosperity P JOIN Counties C ON P.county_id = C.fips_code
    WHERE metric = 'Natural Environment');`;

var recommendations;
if (zip != 0){
    recommendations = `DROP TABLE IF EXISTS user_score;
    CREATE TEMPORARY TABLE user_score
    SELECT SUM(score_2021*ranking) /  ${total} AS current_score
        FROM AdjustedScores A JOIN Districts D ON A.fips_code = D.county_id
        WHERE zip = ${zip};
    DROP TABLE IF EXISTS Recommendations;
    CREATE TEMPORARY TABLE Recommendations
    SELECT A.fips_code, A.name as county, S.name as state, S.id, SUM(score_2021*ranking) / ${total} AS total_score
    FROM AdjustedScores A JOIN States S on S.id = A.state_id
    GROUP BY A.fips_code, A.name, id
    HAVING total_score >= (SELECT * FROM user_score)
    ORDER BY total_score DESC;  

    SELECT * 
    FROM Recommendations
    LIMIT ${offset}, ${pagesize};`

    connection.query(create_temp+ recommendations, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results[6]})
        }
    })
}
else{
    recommendations = `DROP TABLE IF EXISTS Recommendations;
    CREATE TEMPORARY TABLE Recommendations
    SELECT fips_code, A.name as county, S.name as state, S.id, SUM(score_2021*ranking) / ${total} AS total_score
    FROM AdjustedScores A JOIN States S ON S.id=A.state_id
    GROUP BY fips_code, county, id
    ORDER BY total_score DESC;

    SELECT *
    FROM Recommendations
    LIMIT ${offset}, ${pagesize};`
    
    connection.query(create_temp+ recommendations, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results[4]})
        }
    })
}

    
}
// ********************************************
//            QUIZ RESULT ROUTES
// ********************************************

//Route: Retrieve prosperity scores for a given county
async function prosperity(req, res) {
    const county = req.query.county;

    query = `SELECT metric, ROUND(score_2021,0) as score FROM Prosperity
    WHERE county_id = ${county}`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
            console.log({results:results})
        }
    })
}


//Route 2: Returns a list of cities in the selected county, filtered by user preference for city size
async function cities(req, res) {
    const county = req.query.county
    const popLower = req.query.popLower && !isNaN(req.query.popLower) ? req.query.popLower: 0
    const popUpper= req.query.popUpper && !isNaN(req.query.popUpper) ? req.query.popUpper: 10000000
    
    const page = req.query.page && !isNaN(req.query.page) ? req.query.page : 1;
    const pagesize = req.query.pagesize && !isNaN(req.query.pagesize) ? req.query.pagesize: 10;
    var offset = (page -1) * pagesize

    query = `SELECT city, sum(population) as Population, max(pop_density) as Max_Population_Density
    FROM Districts 
    WHERE county_id = ${county}
    GROUP BY city
    HAVING sum(population) > ${popLower}
    AND sum(population) < ${popUpper}
    ORDER BY Population DESC
    LIMIT ${offset}, ${pagesize};`

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

    query = `SELECT month, ROUND(AVG(temp_avg),0) AS 'Avg Temp', ROUND(AVG(temp_min),0) AS 'Low Temp', ROUND(AVG(temp_max),0) AS 'High Temp',
    ROUND(AVG(total_rain),2) AS 'Total Rain', ROUND(AVG(total_snow),2) AS 'Total Snow'
    FROM Climate C  JOIN Weather_Stations W ON C.station_id = W.id
    WHERE county_id = ${county}
    GROUP BY month;`

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
    const page = req.query.page && !isNaN(req.query.page) ? req.query.page : 1;
    const pagesize = req.query.pagesize && !isNaN(req.query.pagesize) ? req.query.pagesize: 10;
    var offset = (page -1) * pagesize

    query = `SELECT title, mean_salary, total_jobs, location_quotient
                FROM Employment E JOIN Jobs J ON E.job_code = J.code
                JOIN CountiesInOccZone C ON C.occ_zone = E.occ_zone
                WHERE county_id = ${county} AND
                title LIKE '%${keyword}%'
                ORDER BY title, mean_salary`

    connection.query(query, function(error, results){
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            res.json({ results: results})
            console.log("Queried Jobs")
        }
    })
}

// ********************************************
//            LISTING SEARCH PAGE ROUTES
// ********************************************

//Route 5: Get Cities and States based on partially or fully completed city input
async function cityState(req, res) {

    const state = req.query.state
    

    query = `SELECT D.city, S.name, C.state_id
    FROM States S JOIN Counties C ON S.id = C.state_id
    JOIN Districts D ON C.fips_code = D.county_id
    ;`

    connection.query(query, function(error, results){

        var resultArray = Object.values(JSON.parse(JSON.stringify(results)))
        var cities = [];
        var currentState;
        var nextState;
        var currentName;
        var currentId;
        var nextId;
        var state;
        var stateCode
        var jObject = {state: " ", stateCode: " ", cities:[]};
        var rObject = [];
        
        
        if (error){
            console.log(error)
            res.json({ error: error})
        } else {
            for(var i = 0; i < resultArray.length-1; i++){
                currentState = resultArray[i]
                nextState = resultArray[i+1]
                currentName = currentState.name
                currentId = currentState.state_id
                nextId = nextState.state_id

                if(currentId === nextId){
                    city = currentState.city;
                    cities.push(city);
                    
                }
                else{
                    cities.push(city);
                    state = currentName
                    stateCode = currentId
                    jObject = {state, stateCode, cities}
                    rObject.push(jObject)
                    cities =[]

                }
                      
                }
                       

            }    


            // console.log(rObject[0].cities)
            res.json({ results: rObject})       
            
            })
}


// ********************************************
//            User Routes
// ********************************************
//Route 6: Retrieve user credentials from Users database upon login
async function getUser(req, res) {
    
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
            console.log("Retrieved User")
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
    const dob = req.query.dob && !isNaN(req.query.dob) ? req.query.dob: 'NULL'
    const zip = req.query.zip && !isNaN(req.query.zip) ? req.query.zip: 'NULL'

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



module.exports = {
    counties, prosperity, cityState, cities, climate, jobs,getUser, addUser,favorites, modifyFavorites
}