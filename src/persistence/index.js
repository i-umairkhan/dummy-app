if (process.env.POSTGRES_HOST) module.exports = require('./pg');
else module.exports = require('./sqlite');
