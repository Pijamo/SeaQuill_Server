const express = require('express');
const mysql = require('mysql');
var cors = require('cors')

const routes = require('./routes')
const configs = require('./config')
const port = process.env.PORT || 8080

const app = express();
const bodyParser = require('body-parser'); app.use(bodyParser.json());

// whitelist localhost 8080
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));

// ********************************************
//            QUIZ ROUTES
// ********************************************

// Route 1- Get recommended counties from quiz inputs
app.get('/counties', routes.counties)


// ********************************************
//            QUIZ RESULT ROUTES
// ********************************************

// Route 2 - Recommended Cities based on Quiz Results and user input on region preference and population size
app.get('/cities', routes.cities)

// Route 3 - Climate
app.get('/climate', routes.climate)

// Route 4 - Jobs
app.get('/jobs', routes.jobs)

// ********************************************
//            LISTING SEARCH PAGE ROUTES
// ********************************************

// Route  5- City, State based on search input
app.get('/cityState', routes.cityState)


// ********************************************
//            LISTINGS PAGES ROUTES
// ********************************************


// ********************************************
//            User Routes
// ********************************************
app.get('/users',routes.users)
app.get('/addUser',routes.addUser)

// ********************************************
//            Favorites Routes
// ********************************************


app.listen(port, () => {
    console.log(`Server running at ${port}`);
});

module.exports = app;