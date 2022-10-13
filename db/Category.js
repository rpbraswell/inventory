let pool = require("./db.js");

class Category {

   constructor(_category) {
      this.id = _category.id ? Number(_category.id) : undefined;
      this.category = _category.category;
   }


   insert(connection, resultHandler) {
      if( !connection ) {
          pool.getConnection()
          .then( conn => { 
             this._insert(conn, true, resultHandler);
          })
          .catch( (err) => {
              resultHandler(err, undefined);
          });
      } else {
         this._insert(conn, false, resultHandler);
      }
   }

   _insert(conn, endConnection, resultHandler) {
          conn.query("insert into categories (category) values (?)", [this.category])
          .then( (res) =>  {
                this.id = res.insertId;
                resultHandler(undefined, this);
          })
          .catch( (err) => {
                resultHandler(err, undefined);
          })
          .finally( () => {
              if( endConnection === true ) {
                  conn.end();
              }
          });
   }

   static getCategories( resultHandler ) {
      pool.getConnection()
      .then( conn => {
            let sql = 'select id,category from categories order by category';
            conn.query( {rowsAsArray: true,  sql: sql } )
            .then( rows => {
                 resultHandler(undefined, rows);
            })
            .catch( (err) => {
                 resultHandler(err, undefined);
            })
            .finally( () => {
               conn.end();
            });
      })
      .catch( (err) => {
           resultHandler(err);
      });
   }

}

module.exports = Category;

