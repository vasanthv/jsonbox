const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const config = require("./src/config");

const app = express();
// set express server middlewares
app.use(express.static(path.join(__dirname, "www")));
app.use(bodyParser.json());

app.use(require('./src/routes'));

app.listen(config.PORT, err => {
	if (err) console.error(err);
	console.log("Server started on " + config.PORT);
});
