const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const model = require("./model");
const config = require("./config");
const validators = require("./validators");

const ipfilter = require('express-ipfilter').IpFilter
const IpDeniedError = require('express-ipfilter').IpDeniedError

// Optionally use IP filter
if (config.FILTER_IP_SET !== undefined &&
	Array.isArray(config.FILTER_IP_SET) &&
	config.FILTER_IP_SET.length > 0) {
	router.use(ipfilter(config.FILTER_IP_SET, config.FILTER_OPTIONS));
}

router.get("/_meta/:boxId", model.xmeta);

// list of all validators to be in place
router.use(validators.removeNativeKeys);
router.use(validators.sizeValidator);
router.use(validators.keysValidator);
router.use(validators.extractParams);
router.use(validators.validateParams);
router.use(validators.authenticateRequest);

// only 100 POST requests are allowed in 60 minutes window
router.post("/*", rateLimit({ windowMs: 60 * 60 * 1000, max: config.REQUEST_LIMIT_PER_HOUR }), model.xpost);
router.get("/*", model.xget);
router.put("/*", model.xput);
router.delete("/*", model.xdelete);

/**
 * DATA endpoint's common error handling middleware
 */
router.use((err, req, res, next) => {
	console.error(err);
	if (err instanceof IpDeniedError) {
		res.status(403).json({ message: "Forbidden" });
	} else {
		res.status(err.statusCode || 500).json({ message: err.message });
	}
});

module.exports = router;
