const memorySizeOf = (obj) => {
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
	};
	return sizeOf(obj);
};
const isValidKeys = (obj) => {
	const keys = Object.keys(obj);
	return keys.every(key => /^[A-Za-z]/i.test(key[0]));
}
const responseBody = (obj, collection) => {
	let response = {};
	response['_id'] = obj._id;
	const data = obj.data;
	response = { ...response, ...data };
	response['_createdOn'] = obj._createdOn;
	if (obj._updatedOn) response['_updatedOn'] = obj._updatedOn;
	if (!collection && obj._collection) response['_collection'] = obj._collection;
	return response;
}

module.exports = {
	memorySizeOf,
	isValidKeys,
	responseBody
}
