const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const model = require('./model');
const validators = require('./validators');

// list of all validators to be in place
router.use(validators.removeNativeKeys);
router.use(validators.sizeValidator);
router.use(validators.keysValidator);
router.use(validators.extractParams);
router.use(validators.validateParams);

// only 100 POST requests are allowed in 60 minutes window
router.post('/*', rateLimit({ windowMs: 60 * 60 * 1000, max: 100 }), model.xpost);
router.get('/*', model.xget);
router.put('/*', model.xput);
router.delete('/*', model.xdelete);

/**
 * DATA endpoint's common error handling middleware
 */
router.use((err, req, res, next) => {
	console.error(err);
	res.status(err.statusCode || 500).json({ message: err.message });
});

module.exports = router;
