const mariadb = require('mariadb');

const pool = mariadb.createPool({ 
   host: 'localhost', user: 'themission', password: 'fbcowasso', database: 'warehouse' 
});


class Table {
   constructor() {
      // pool.getConnection().then( conn => {
         // this.conn = conn;
      // })
      // .catch(err => {
          // console.log('Table: could not connect to the database: ' + err.message);
      // });
   }
}


module.exports = pool;

