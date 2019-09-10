const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const config = require("./src/config");

const app = express();
// set express server middlewares
app.use(express.static(path.join(__dirname, "www"), { maxAge: (3600000 * 4) }));
app.use(bodyParser.json());

app.post('/paypal', require('./src/paypal'));
app.get('/expire', async (req, res) => {
	try {
		const Db = require('./src/db').getInstance();
		const response = await Db.Box.updateMany({ expiresOn: { $lt: new Date() }, type: "PRIVATE" }, { type: 'EXPIRED' });
		res.json(response);
	} catch (err) {
		res.status(500).json(err);
	}
});
app.use(require('./src/data/routes'));


app.listen(config.PORT, err => {
	if (err) console.error(err);
	console.log("Server started on " + config.PORT);
});
