const config = require('./config');

const memorySizeOf = obj => {
	// took this function from https://stackoverflow.com/a/50180927/607608
	var bytes = 0;

	function sizeOf(obj) {
		if (obj !== null && obj !== undefined) {
			switch (typeof obj) {
				case 'number':
					bytes += 8;
					break;
				case 'string':
					bytes += obj.length * 2;
					break;
				case 'boolean':
					bytes += 4;
					break;
				case 'object':
					var objClass = Object.prototype.toString.call(obj).slice(8, -1);
					if (objClass === 'Object' || objClass === 'Array') {
						for (var key in obj) {
							if (!obj.hasOwnProperty(key)) continue;
							sizeOf(obj[key]);
						}
					} else bytes += obj.toString().length * 2;
					break;
			}
		}
		return bytes;
	}
	return sizeOf(obj);
};

const isValidKeys = obj => {
	const keys = Object.keys(obj);
	return keys.every(key => /^[A-Za-z]/i.test(key[0]));
};

const responseBody = (obj, collection) => {
	let response = {};
	response['_id'] = obj._id;
	const data = obj.data;
	response = { ...response, ...data };
	response['_createdOn'] = obj._createdOn;
	if (obj._updatedOn) response['_updatedOn'] = obj._updatedOn;
	if (!collection && obj._collection) response['_collection'] = obj._collection;
	return response;
};

const parse_query = req_q => {
	let query = {};
	let q = {};
	req_q.split(',').forEach(i => (q[i.split(':')[0]] = i.split(':')[1]));
	Object.keys(q).forEach(key => {
		const value = q[key];
		if (
			value.startsWith('>=') ||
			value.startsWith('<=') ||
			value.startsWith('>') ||
			value.startsWith('<') ||
			value.startsWith('=')
		) {
			// Querying a Number
			let val = 0;
			if (value.startsWith('>=') || value.startsWith('<=')) val = value.substr(2);
			else val = value.substr(1);

			if (value.startsWith('>=')) query['data.' + key] = { $gte: +val };
			else if (value.startsWith('<=')) query['data.' + key] = { $lte: +val };
			else if (value.startsWith('>')) query['data.' + key] = { $gt: +val };
			else if (value.startsWith('<')) query['data.' + key] = { $lt: +val };
			else if (value.startsWith('=')) query['data.' + key] = +val;
		} else if (value.startsWith('*') || value.endsWith('*')) {
			// Need to do regex query
			let val = value;
			if (value.startsWith('*')) val = value.substr(1);
			if (value.endsWith('*')) val = val.substr(0, val.length - 1);

			let regexp;
			if (value.startsWith('*') && value.endsWith('*')) regexp = new RegExp(val, 'i');
			else if (value.startsWith('*')) regexp = new RegExp(val + '$', 'i');
			else if (value.endsWith('*')) regexp = new RegExp('^' + val, 'i');
			query['data.' + key] = regexp;
		} else {
			if (value == 'true') query['data.' + key] = true;
			else if (value == 'false') query['data.' + key] = false;
			else query['data.' + key] = new RegExp('^' + value + '$', 'i');
		}
	});

	return query;
};

const getExpiryDate = () => {
	const expiryDate = new Date();
	expiryDate.setDate(expiryDate.getDate() + config.DATA_EXPIRY_IN_DAYS);
	return expiryDate;
}

module.exports = {
	memorySizeOf,
	isValidKeys,
	responseBody,
	parse_query,
	getExpiryDate
};
