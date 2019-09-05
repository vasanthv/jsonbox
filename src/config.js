module.exports = {
	PORT: process.env.PORT || 5000,
	MONGO_URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/jsonbox-dev',
	DATA_MONGO_URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/jsonbox-data-dev',
	PAGE_LIMIT: process.env.PAGE_LIMIT || 50
}
