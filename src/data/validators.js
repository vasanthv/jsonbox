const helper = require('./helper');
const Db = require('../db').getInstance();

// remove the native keys from req.body
const removeNativeKeys = (req, res, next) => {
	delete req.body._id;
	delete req.body._createdOn;
	delete req.body._updatedOn;
	delete req.body._collection;
	next();
}

// size of the JSON body should be larger than 100KB
const sizeValidator = (req, res, next) => {
	if (req.method === 'POST' || req.method === 'PUT') {
		const memorySize = helper.memorySizeOf(req.body);
		req['bodySize'] = memorySize;
		// memorySize is size in bytes
		if (memorySize > 100000) {
			throwError("JSON body is too large. Should be less than 100KB", 413);
		} else if (Array.isArray(req.body)) {
			if (req.body.length > 1000) {
				throwError("Not more than 1000 records for bulk upload.", 413);
			} else next();
		} else next();
	} else next();
}

// The Body top level keys should start with an alphabet
const keysValidator = (req, res, next) => {
	let validKeys = Array.isArray(req.body) ? req.body.every(helper.isValidKeys) : helper.isValidKeys(req.body);
	if (validKeys) next();
	else throwError("Invalid JSON keys. Keys should start with an alphabet");
}

// extract the box, collection, record ids from the path
const extractParams = (req, res, next) => {
	const path = req.path;
	const pathParams = path.split('/').filter(p => !!p);
	const isHexString = /^([0-9A-Fa-f]){24}$/;
	const isValidBoxID = /^[0-9A-Za-z_]+$/i;
	if (pathParams[0]) {
		req['box'] = isValidBoxID.test(pathParams[0]) ? pathParams[0] : undefined;
		if (pathParams[1]) {
			const isObjectId = isHexString.test(pathParams[1]);
			if (isObjectId) req['recordId'] = pathParams[1];
			else req['collection'] = isValidBoxID.test(pathParams[1]) ? pathParams[1] : undefined;
		}
		if (!req['recordId'] && pathParams[2]) {
			req['recordId'] = isHexString.test(pathParams[2]) ? pathParams[2] : undefined;
		}
		next();
	} else throwError("Box id cannot be empty.");
}

// check if all the required parameters is present
const validateParams = (req, res, next) => {
	if (!req.box) throwError('Invalid or empty box id');
	else if (req.box.length < 20 || req.box.length > 64) throwError('Box id must be atleast 20 chars long & max. 64 chars.');
	else if (req.collection ? req.collection.length > 32 : false) throwError('Collection name can\'t be more than 32 chars.');
	else if (req.method === "PUT" || req.method === "DELETE") {
		if (!req.recordId) throwError('Invalid or empty record id');
		else if (Array.isArray(req.body)) throwError('Bulk update not supported.');
		else next();
	} else next();
};

const getBoxDetails = async (req, res, next) => {
	const thisBox = await Db.Box.findOne({ key: req.box }).exec();
	if (thisBox) {
		req['boxType'] = thisBox.type;
		req['boxDetails'] = thisBox;
	} else {
		req['boxType'] = 'PUBLIC';
	}
	next();
}

// Limit the size of records if its public or expired 
const publicBoxValidation = (req, res, next) => {
	if (req.boxType === 'PRIVATE') next();
	else {
		if (req.bodySize > 10000) throwError("JSON body is too large. Should be less than 10KB", 413);
		else next();
	}
}

// check the API_SECRET for the PRIVATE Box
const privateBoxValidation = (req, res, next) => {
	if (req.boxType === 'PUBLIC' || req.boxType === 'EXPIRED') next();
	else {
		const API_SECRET = req.headers['api-secret'] || req.headers['x-api-secret'];
		req['API_SECRET'] = API_SECRET;
		if (API_SECRET) {
			const getApiSecretDetails = req.boxDetails.access.find(a => a.key === API_SECRET);
			if (getApiSecretDetails) {
				if (req.method === 'GET') next();
				else if (getApiSecretDetails.permission === 'READWRITE') next();
				else throwError("Do not have write access", 401);
			} else throwError("Invalid or empty API Secret", 401);
		} else throwError("Invalid or empty API Secret", 401);
	}
}

const throwError = (message, code) => {
	const errorObject = new Error(message);
	errorObject.statusCode = code || 400;
	throw errorObject;
}

module.exports = {
	removeNativeKeys,
	sizeValidator,
	keysValidator,
	extractParams,
	validateParams,
	getBoxDetails,
	publicBoxValidation,
	privateBoxValidation
}
