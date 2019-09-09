const router = require('express').Router();

const model = require('./model');
const validators = require('./validators');

router.use((req, res, next) => {
	console.log('----------GOT HERE');
	console.log(req.path);
	next();
})
// list of all validators to be in place
router.use(validators.sizeValidator);
router.use(validators.keysValidator);
router.use(validators.extractParams);
router.use(validators.validateParams);
router.use(validators.getBoxDetails);
router.use(validators.publicBoxValidation);
router.use(validators.privateBoxValidation);

router.post('/*', model.xpost);
router.get('/*', model.xget);
router.put('/*', model.xput);
router.delete('/*', model.xdelete);

/**
 * DATA endpoints common error handling middleware
 */
router.use((err, req, res, next) => {
	console.error(err);
	res.status(err.statusCode || 500).json({ message: err.message });
});

module.exports = router;
