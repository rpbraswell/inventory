import mariadb from 'mariadb'
//const mariadb = require('mariadb');

const pool = mariadb.createPool({ 
   host: 'localhost', user: 'themission', password: 'fbcowasso', database: 'warehouse' 
});

export default pool;

