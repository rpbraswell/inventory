const mariadb = require('mariadb');

const pool = mariadb.createPool({ 
   host: 'localhost', user: 'themission', password: 'fbcowasso', database: 'warehouse' 
});


module.exports = pool;

