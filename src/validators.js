const helper = require("./helper");
const config = require("./config");

const Data = require("./db").getInstance();

// remove the system keys from req.body
const removeNativeKeys = (req, res, next) => {
	delete req.body._id;
	delete req.body._createdOn;
	delete req.body._updatedOn;
	delete req.body._collection;
	delete req.body._expiry;
	next();
};

// validator: size of payload should be < 10KB
const sizeValidator = (req, res, next) => {
	if (req.method === "POST" || req.method === "PUT") {
		if (Object.keys(req.body).length > 0) {
			const memorySize = helper.memorySizeOf(req.body);
			req["bodySize"] = memorySize;

			// memorySize is size in bytes. 10KB  => 10 * 1024
			if (memorySize > config.SIZE_LIMIT * 1024) {
				throwError(`JSON body is too large. Should be less than ${config.SIZE_LIMIT}KB`, 413);
			} else if (Array.isArray(req.body)) {
				if (req.body.length > 1000) {
					throwError("Not more than 1000 records for bulk upload.", 413);
				} else next();
			} else next();
		} else throwError("Empty body.", 400);
	} else next();
};

// The Body top level keys should start with an alphabet
const keysValidator = (req, res, next) => {
	let validKeys = Array.isArray(req.body) ? req.body.every(helper.isValidKeys) : helper.isValidKeys(req.body);
	if (validKeys) next();
	else throwError("Invalid JSON keys. Keys should start with an alphabet");
};

// extract the box, collection, record ids from the path
const extractParams = (req, res, next) => {
	const path = req.path;
	const pathParams = path.split("/").filter((p) => !!p);
	const isHexString = /^([0-9A-Fa-f]){24}$/;
	const isValidBoxID = /^[0-9A-Za-z_]+$/i;

	req["apiKey"] =
		req.headers["x-api-key"] || (req.headers["authorization"] ? req.headers["authorization"].split(" ")[1] : null);

	if (pathParams[0]) {
		req["box"] = isValidBoxID.test(pathParams[0]) ? pathParams[0] : undefined;

		if (pathParams[1]) {
			const isObjectId = isHexString.test(pathParams[1]);
			if (isObjectId) req["recordId"] = pathParams[1];
			else req["collection"] = isValidBoxID.test(pathParams[1]) ? pathParams[1] : undefined;
		}

		if (!req["recordId"] && pathParams[2]) {
			req["recordId"] = isHexString.test(pathParams[2]) ? pathParams[2] : undefined;
		}

		next();
	} else throwError("Box id cannot be empty.");
};

// check if all the required parameters is present
const validateParams = (req, res, next) => {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	if (!req.box) {
		throwError("Invalid or empty box id");
	} else if (req.box.length < 20 || req.box.length > 64) {
		throwError("Box id must be atleast 20 chars long & max. 64 chars.");
	} else if (req.collection ? req.collection.length > 20 : false) {
		throwError("Collection name can't be more than 20 chars.");
	} else if (req.method === "PUT" || req.method === "DELETE") {
		if (!req.recordId && !req.query.q) {
			throwError("Invalid or empty record id or missing query definition");
		} else if (Array.isArray(req.body)) {
			throwError("Bulk update not supported.");
		} else next();
	} else if (req.apiKey) {
		if (uuidRegex.test(req["apiKey"])) next();
		else throwError("Invalid API-KEY. API-KEY Should be a UUID.");
	} else next();
};

// Check if the Request has a valid API_KEY
const authenticateRequest = async (req, res, next) => {
	try {
		if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
			const firstRecord = await Data.findOne({ _box: req.box })
				.select("_apiKey")
				.sort("-_createdOn")
				.exec();
			if (firstRecord) {
				if (firstRecord._apiKey) {
					if (firstRecord._apiKey == req["apiKey"]) next();
					else throwError("Invalid API_KEY.", 401);
				} else {
					// dont pass API_KEY if the first data does not have key
					req["apiKey"] = null;
					next();
				}
			} else next();
		} else next();
	} catch (error) {
		next(error);
	}
};

const throwError = (message, code = 400) => {
	const errorObject = new Error(message);
	errorObject.statusCode = code;
	throw errorObject;
};

module.exports = {
	removeNativeKeys,
	sizeValidator,
	keysValidator,
	extractParams,
	validateParams,
	authenticateRequest,
};
