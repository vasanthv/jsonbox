const helper = require('./helper');
const Db = require('../db').getInstance();
const Data = Db.Data;

const xpost = async (req, res, next) => {
	try {
		const createRecord = async (body) => {
			const date = new Date();
			let record = { _box: req.box };
			if (req.collection) record['_collection'] = req.collection;
			record['_createdOn'] = date;
			record['_createdBy'] = req.API_KEY;
			record['data'] = body;
			const newRecord = await new Data(record).save();
			console.log(helper.responseBody(newRecord));
			return helper.responseBody(newRecord);
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
	// increment a count in the box collection;
	// await Db.Box.updateOne({ key: req.box }, { $inc: { noOfRecords: 1 } });
};
const xget = async (req, res, next) => {
	try {
		if (req.recordId) {
			const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
			res.json(helper.responseBody(record));
		} else {
			const skip = req.query.skip ? +(req.query.skip) : 0;
			let limit = req.query.limit ? +(req.query.limit) : 20;
			limit = limit > 100 ? 100 : limit;
			let sort = req.query.sort ? req.query.sort : '-_createdOn';
			if (!['_createdOn', '-_createdOn', '_updatedOn', '-_updatedOn'].includes(sort)) {
				sort = (sort[0] === '-') ? '-data.' + sort.substr(1) : 'data.' + sort;
			}

			let query = {};

			if (req.query.query_key && req.query.query_value) {
				let regexp;
				switch (req.query.query_type) {
					case 'startswith':
					case 'startsWith':
						regexp = new RegExp("^" + req.query.query_value, "i");
						break;
					case 'endswith':
					case 'endsWith':
						regexp = new RegExp(req.query.query_value + '$', "i");
						break;
					case 'anywhere':
					case 'anyWhere':
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
			res.json(records.map(helper.responseBody));
		}
	} catch (error) {
		next(error);
	}
};
const xput = async (req, res, next) => {
	try {
		const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
		if (record) {
			await Data.updateOne({ _id: req.recordId, _box: req.box }, { data: req.body });
			res.json({ message: "Record updated." });
		} else { res.status(400).json({ message: "Invalid record Id" }) }
	} catch (error) {
		next(error);
	}
};
const xdelete = async (req, res, next) => {
	try {
		const record = await Data.findOne({ _id: req.recordId, _box: req.box }).exec();
		if (record) {
			await Data.deleteOne({ _id: req.recordId, _box: req.box });
			res.json({ message: "Record removed." });
		} else { res.status(400).json({ message: "Invalid record Id" }) }
	} catch (error) {
		next(error);
	}
	// decrement a count in the box collection;
	// await Db.Box.updateOne({ key: req.box }, { $inc: { noOfRecords: -1 } });
};

module.exports = {
	xpost,
	xget,
	xput,
	xdelete
}
