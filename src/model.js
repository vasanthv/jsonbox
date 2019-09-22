const helper = require('./helper');
const Data = require('./db').getInstance();

const xpost = async (req, res, next) => {
	try {
		const createRecord = async (body) => {
			const date = new Date();
			let record = { _box: req.box };
			if (req.collection) record['_collection'] = req.collection;
			record['_createdOn'] = date;
			record['_createdBy'] = req.API_SECRET;
			record['data'] = body;
			const newRecord = await new Data(record).save();
			return helper.responseBody(newRecord, req.collection);
		}

		if (Array.isArray(req.body)) {
			const createRecordPromise = req.body.map(createRecord);
			const newRecords = await Promise.all(createRecordPromise);
			res.json(newRecords);
		} else {
			const newRecord = await createRecord(req.body);
			res.json(newRecord);
		}

	} catch (error) {
		next(error);
	}
};
const xget = async (req, res, next) => {
	try {
		if (req.recordId) {
			const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
			res.json(helper.responseBody(record, req.collection));
		} else {
			const skip = req.query.skip ? +(req.query.skip) : 0;
			let limit = req.query.limit ? +(req.query.limit) : 20;
			limit = limit > 1000 ? 1000 : limit;
			let sort = req.query.sort ? req.query.sort : '-_createdOn';
			if (!['_createdOn', '-_createdOn', '_updatedOn', '-_updatedOn'].includes(sort)) {
				sort = (sort[0] === '-') ? '-data.' + sort.substr(1) : 'data.' + sort;
			}

			let query = {};

			if (req.query.q) {
				query = parse_query(req.query.q)
			} else if (req.query.query_key && req.query.query_value) {
				// soon to be DEPRECATED
				let regexp;
				const queryType = (typeof req.query.query_type === 'string') ? req.query.query_type.toLowerCase() : null;
				switch (queryType) {
					case 'startswith':
						regexp = new RegExp("^" + req.query.query_value, "i");
						break;
					case 'endswith':
						regexp = new RegExp(req.query.query_value + '$', "i");
						break;
					case 'anywhere':
						regexp = new RegExp(req.query.query_value, "i");
						break;
					default:
						regexp = new RegExp('^' + req.query.query_value + '$', "i");
						break;
				}
				query['data.' + req.query.query_key] = regexp;
			}
			query['_box'] = req.box;
			if (req.collection) query['_collection'] = req.collection;
			const records = await Data.find(query).skip(skip).limit(limit).sort(sort).exec();
			res.json(records.map(r => helper.responseBody(r, req.collection)));
		}
	} catch (error) {
		next(error);
	}
};
const xput = async (req, res, next) => {
	try {
		const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
		if (record) {
			await Data.updateOne({ _id: req.recordId, _box: req.box }, {
				_updatedOn: new Date(),
				_updatedBy: req.API_SECRET,
				data: req.body
			});
			res.json({ message: "Record updated." });
		} else { res.status(400).json({ message: "Invalid record Id" }) }
	} catch (error) {
		next(error);
	}
};
const xdelete = async (req, res, next) => {
	try {
		if (req.recordId) {
			const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
			if (record) {
				await Data.deleteOne({ _id: req.recordId, _box: req.box });
				res.json({ message: "Record removed." });
			} else { res.status(400).json({ message: "Invalid record Id" }) }
		} else if (req.query.q) {
			query = parse_query(req.query.q)

			await Data.deleteMany(query);
			res.json({ message: "Records removed." });
		}
	} catch (error) {
		next(error);
	}
};

const parse_query = (req_q) => {
	let query = {};
	let q = {};
	req_q.split(',').forEach(i => (q[i.split(':')[0]] = i.split(':')[1]));
	Object.keys(q).forEach((key) => {
		const value = q[key];
		if (value.startsWith('>=') || value.startsWith('<=') || value.startsWith('>') || value.startsWith('<') || value.startsWith('=')) {
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
			if (value.startsWith('*') && value.endsWith('*')) regexp = new RegExp(val, "i");
			else if (value.startsWith('*')) regexp = new RegExp(val + '$', "i");
			else if (value.endsWith('*')) regexp = new RegExp("^" + val, "i");
			query['data.' + key] = regexp;
		} else {
			if (value == 'true') query['data.' + key] = true;
			else if (value == 'false') query['data.' + key] = false;
			else query['data.' + key] = new RegExp('^' + value + '$', "i");
		}
	});

	return query;
}

module.exports = {
	xpost,
	xget,
	xput,
	xdelete
}
