require('dotenv').config();

module.exports = {
	SIZE_LIMIT: 10000, // mentioned in KB
	PORT: process.env.PORT || 3000,
	MONGO_URL: process.env.MONGODB_URI || "mongodb://localhost:27017/jsonbox-io-dev",
	REQUEST_LIMIT_PER_HOUR: 99999,
	ENABLE_DATA_EXPIRY: false, // Once switched on the index will be be set in mongodb. Might need to remove it in order to switch off the behaviour
	DATA_EXPIRY_IN_DAYS: 30,
};
