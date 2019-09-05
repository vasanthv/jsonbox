const helper = require('./helper');

// size of the JSON body should be larger than 100KB
const sizeValidator = (req, res, next) => {
	if (req.method === 'POST' || req.method === 'PUT') {
		const memorySize = helper.memorySizeOf(req.body);
		// memorySize is size in bytes
		if (memorySize > 100000) {
			const errorObject = new Error("JSON body is too large. Should be less than 100KB");
			errorObject.statusCode = 400;
			throw errorObject;
		} else if (Array.isArray(req.body)) {
			if (req.body.length > 1000) {
				const errorObject = new Error("Not more than 1000 records for bulk upload.");
				errorObject.statusCode = 400;
				throw errorObject;
			} else next();
		} else next();
	} else next();
}

// The Body top level keys should start with an alphabet
const keysValidator = (req, res, next) => {
	let validKeys = Array.isArray(req.body) ? req.body.every(helper.isValidKeys) : helper.isValidKeys(req.body);
	if (validKeys) next();
	else {
		const errorObject = new Error("Invalid JSON keys. Keys should start with an alphabet");
		errorObject.statusCode = 400;
		throw errorObject;
	}
}

// extract the box, collection, record ids from the path
const extractParams = (req, res, next) => {
	const path = req.path;
	const pathParams = path.split('/').filter(p => !!p);
	const isHexString = /^([0-9A-Fa-f]){24}$/;
	if (pathParams[0]) {
		req['box'] = pathParams[0];
		if (pathParams[1]) {
			const isObjectId = isHexString.test(pathParams[1]);
			if (isObjectId) req['recordId'] = pathParams[1];
			else req['collection'] = pathParams[1];
		}
		if (!req['recordId'] && pathParams[2]) {
			req['recordId'] = isHexString.test(pathParams[2]) ? pathParams[2] : undefined;
		}
		next();
	} else {
		const errorObject = new Error("Box id cannot be empty.");
		errorObject.statusCode = 400;
		throw errorObject;
	}
}

// check if all the required parameters is present
const validateParams = (req, res, next) => {
	const throwError = (message) => {
		const errorObject = new Error(message);
		errorObject.statusCode = 400;
		throw errorObject;
	}
	if (!req.box) throwError('Invalid or empty box id');
	else if (req.method === "PUT" || req.method === "DELETE") {
		if (!req.recordId) throwError('Invalid or empty record id');
		else if (Array.isArray(req.body)) throwError('Bulk update not supported.');
		else next();
	} else next();

};

// check the API_KEY for the Box
const validateBox = (req, res, next) => {
	console.log(req.body);
	console.log(req.box);
	console.log(req.collection);
	console.log(req.recordId);
	res.send('Jahdf');
}
// Limit the number of records if its public or expired 

module.exports = {
	sizeValidator,
	keysValidator,
	extractParams,
	validateParams,
	validateBox
}
