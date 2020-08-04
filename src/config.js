require('dotenv').config();

module.exports = {
  SIZE_LIMIT: 1000, // mentioned in KB
  PORT: process.env.PORT || 3000,
  MONGO_URL: process.env.MONGODB_URI || "mongodb://localhost:27017/jsonbox-io-dev",
  REQUEST_LIMIT_PER_HOUR: 99999,
};
