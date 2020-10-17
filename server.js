const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./src/config');
const routes = require('./src/routes');
const ipfilter = require('express-ipfilter').IpFilter
const IpDeniedError = require('express-ipfilter').IpDeniedError


const app = express();

// Optionally use IP filter
if (config.FILTER_IP_SET !== undefined 
	&& Array.isArray(config.FILTER_IP_SET) 
	&& config.FILTER_IP_SET.length > 0) {
		app.use(ipfilter(config.FILTER_IP_SET, config.FILTER_OPTIONS));
}

app.enable('trust proxy');
// set express server middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, 'www')));
app.use(bodyParser.json());

app.get('/v2', (req, res) => res.sendFile(path.join(__dirname, 'www/index.html')));

app.use(routes);

app.use((err, req, res, next) => {
    console.error(err)
    if (err instanceof IpDeniedError) {
    	res.status(403).json({ message: "Forbidden" });
	}
});

app.listen(config.PORT, err => {
	if (err) console.error(err);
	console.log('Server started on ' + config.PORT);
});
