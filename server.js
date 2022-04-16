const express = require('express');
const mysql = require('mysql');
var cors = require('cors')

const routes = require('./routes')
const configs = require('./config')
const port = process.env.PORT || 8080

const app = express();

// whitelist localhost 8080
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));

// Route 1 - register as GET 
app.get('/', routes.hello)

// Route 1- Recommended counties
app.get('/counties', routes.counties)

// Route 2 - City, State based on search input
app.get('/searchCity', routes.searchCity)

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});

module.exports = app;