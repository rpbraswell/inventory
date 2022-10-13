let pool = require("./db.js");

class Unit {

   constructor(_unit) {
      this.id = _unit.id ? Number(_unit.id) : undefined;
      this.unit = _unit.unit;
   }

   insert(connection, resultHandler) {
      if( !connection ) {
          pool.getConnection()
          .then( conn => { 
             this._insert(conn, true, resultHandler);
          })
          .catch( (err) => {
              resultHandler(err,undefined);
          });
      } else {
         this._insert(conn, false, resultHandler);
      }
   }

   _insert(conn, endConnection, resultHandler) {
          conn.query("insert into units (unit) values (?)", [this.unit])
          .then( (res) =>  {
                this.id = res.insertId;
                resultHandler(undefined, this);
          })
          .catch( (err) => {
                resultHandler(err,undefined);
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
module.exports = Unit;

