const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const cors = require('cors');
const config = require("./src/config");
const routes = require("./src/routes");

const app = express();

app.enable("trust proxy");
// set express server middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, "www")));
app.use(bodyParser.json());

app.use(routes);

app.listen(config.PORT, err => {
	if (err) console.error(err);
	console.log("Server started on " + config.PORT);
});
