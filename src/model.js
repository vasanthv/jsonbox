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
				query = helper.parse_query(req.query.q);
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
			const query = helper.parse_query(req.query.q)
			query['_box'] = req.box;
			
			const result = await Data.deleteMany(query);
			res.json({ message: result.deletedCount + " Records removed." });
		}
	} catch (error) {
		next(error);
	}
};


module.exports = {
	xpost,
	xget,
	xput,
	xdelete
}
