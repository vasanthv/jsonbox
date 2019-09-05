const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const config = require("./src/config");

const app = express();
// set express server middlewares
app.use(express.static(path.join(__dirname, "www"), { maxAge: (3600000 * 4) }));
app.use(bodyParser.json());

// app.use('/users', require('./src/users/routes'));
app.use('/', require('./src/data/routes'));


app.listen(config.PORT, err => {
	if (err) console.error(err);
	console.log("Server started on " + config.PORT);
});
