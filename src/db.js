/**
 * A singleton implemetaion for the database
 */

const mongoose = require('mongoose');
const config = require('./config');

module.exports = (() => {
	let instance;
	let db = mongoose.connection;

	const connectToDb = () => {
		mongoose.connect(config.MONGO_URL, {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			autoReconnect: true
		});
	};

	const createInstance = () => {
		db.on('error', error => {
			console.error('Error in MongoDb connection: ' + error);
			mongoose.disconnect(); // Trigger disconnect on any error
		});
		db.on('connected', () => console.log('Data Db connected'));
		db.on('disconnected', () => {
			console.log('MongoDB disconnected!');
			connectToDb();
		});

		connectToDb();
		const Schema = mongoose.Schema;

		// Data Schema
		const dataSchema = new Schema({
			_box: { type: String, index: true, select: false }, // box to which the record belongs
			_collection: { type: String, index: true }, // Any collection if user passes in URL
			_createdOn: Date, // Date on which its created
			_createdBy: { type: String, select: false }, // API KEY used to create the record
			_updatedOn: Date, // Date on which its updated
			_updatedBy: { type: String, select: false }, // API KEY used to updated the record
			data: { type: Object } // Actual data of the record
		});

		return mongoose.model('Data', dataSchema);
	};

	return {
		getInstance: () => {
			if (!instance) {
				instance = createInstance();
			}
			return instance;
		}
	};
})();
