let pool = require("./db.js");

class Category {

   constructor(_category) {
      this.id = _category.id;
      this.category = _category.category;
   }

   updateOK() {
       return this.id;
   }

   insertOK() {
       return !this.id && typeof this.category === 'string';
   }

   insert(connection, resultHandler) {

      if( !this.insertOK() ) {
          resultHandler(new Error("validation failed for inserting category"));
          return false;
      }

      console.log("category validation successful for insertion");
      if( !connection ) {
          console.log("getting new connection");
          pool.getConnection()
          .then( conn => { 
             this._insert(conn, resultHandler, true);
          })
          .catch( (err) => {
              resultHandler(err);
          });
      } else {
         this._insert(conn, resultHandler, false);
      }
   }

   _insert(conn, resultHandler, endConnection) {
          conn.query("insert into categories (category) values (?)", [this.category])
          .then( (res) =>  {
                this.id = res.insertId;
                console.log("got good result: " + res);
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("got error inserting item");
                resultHandler(err);
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
                 resultHandler(rows);
            })
            .catch( (err) => {
                 resultHandler(err);
            })
            .finally( () => {
               conn.end();
            });
      })
      .catch( (err) => {
           resultHandler(err);
      });
   }


   static addCategory(_category, resultHandler ) {
        console.log(JSON.stringify(_category));
        let category = new Category(_category);
        category.insert(undefined, resultHandler);
   }

}

module.exports = Category;

