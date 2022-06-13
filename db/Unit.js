let pool = require("./db.js");

class Unit {

   constructor(_unit) {
      this.id = _unit.id;
      this.unit = _unit.unit;
   }

   updateOK() {
       return this.id;
   }

   insertOK() {
       return !this.id && typeof this.unit === 'string';
   }

   insert(connection, resultHandler) {

      if( !this.insertOK() ) {
          resultHandler(new Error("validation failed for inserting item"));
          return false;
      }

      console.log("unit validation successful for insertion");
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
          conn.query("insert into units (unit) values (?)", [this.unit])
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

   static getUnits( resultHandler ) {
      pool.getConnection()
      .then( conn => {
            let sql = 'select id,unit from units order by unit';
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


   static addUnit(_unit, resultHandler ) {
        console.log(JSON.stringify(_unit));
        let unit = new Unit(_unit);
        unit.insert(undefined, resultHandler);
   }

}
module.exports = Unit;

