const express = require('express');
const mysql = require('mysql');
var cors = require('cors')

const routes = require('./routes')
const configs = require('./config')
const port = process.env.PORT || 8080

const app = express();
const bodyParser = require('body-parser'); app.use(bodyParser.json());

// whitelist localhost 3000
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

//Route 3: Returns climate information for the selected county
app.get('/climate', routes.climate)

//Route 4: Returns job information for the selected county
app.get('/jobs', routes.jobs)

// ********************************************
//            LISTING SEARCH PAGE ROUTES
// ********************************************

//Route 5: Get Cities and States based on partially or fully completed city input
app.get('/cityState', routes.cityState)


// ********************************************
//            LISTINGS PAGES ROUTES
// ********************************************


// ********************************************
//            User Routes
// ********************************************
//Route 6: Retrieve user credentials from Users database upon login
app.get('/users',routes.users)

//Route 7: Add user credentials to Users database
app.get('/addUser',routes.addUser)

// ********************************************
//            Favorites Routes
// ********************************************

//Route 8: Retrieve favorite county for user from Favorites database
app.get('/favorites',routes.favorites)

//Route 9: Add favorite county to Favorites database
app.get('/favorites/:action',routes.modifyFavorites)

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});

module.exports = app;