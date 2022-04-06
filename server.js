const express = require('express');
const mysql = require('mysql');
var cors = require('cors')

const routes = require('./routes')
const port = process.env.PORT || 3000

const app = express();

// whitelist localhost 3000
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));

// Route 1 - register as GET 
app.get('/', routes.hello)

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});

module.exports = app;