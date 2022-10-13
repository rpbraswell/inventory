
const pool = require("./db");
const Item = require("./Item");

class Shipping {

   constructor(shipped) {
      this.id         = shipped.id     ? Number(shipped.id)     : undefined;
      this.itemId     = shipped.itemId ? Number(shipped.itemId) : undefined;
      this.qty        = shipped.qty    ? Number(shipped.qty)    : undefined;
      this.shippedAt  = shipped.shippedAt;
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
         this._insert(connection, false, resultHandler);
      }
   }

   _insert(conn, endConnection, resultHandler) {
          conn.query("insert into shipping (itemId, qty) values (?,?)", 
                 [this.itemId, this.qty])
          .then( res =>  {
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

   static shipItem( item, qty, resultHandler ) {
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                       let shipped = new Shipping({itemId: item.id, qty: qty});
                       shipped.insert(conn, (err, ship) => {
                            if (err) {
                                    conn.rollback()
                                    .then( () => {
                                         console.log("successfully rolled back transaction");
                                    })
                                    .catch( (rollbackErr) => {
                                          console.log(rollbackErr);
                                     })
                                    .finally( () => {
                                        conn.end();
                                        resultHandler(err, null);                                    
                                    });
                            } else {
                                item.qty -= qty;
                                if( item.qty < 0 ) {
                                    item.qty = 0;
                                }
                                item.update(conn, (err, res) => {
                                    if (err) {
                                        conn.rollback()
                                        .then( () => {
                                             console.log("successfully rolled back transaction");
                                        })
                                        .catch( (rollbackErr) => {
                                             console.log(rollbackErr);
                                        })
                                        .finally( () => {
                                             conn.end();
                                             resultHandler(err, undefined);
                                        });
                                        
                                    } else {
                                        conn.commit()
                                         .then( () => {
                                             resultHandler(undefined, ship);
                                         })
                                         .catch( (commitErr) => {
                                              resultHandler(commitErr, null);
                                         })
                                         .finally( () => {
                                             conn.end();
                                         });
                                    }
                                });
                               }
                       });   // shipped.insert()
                    })  // conn.beginTransaction
                    .catch( (err) => {
                        resultHandler(err, undefined);
                    });
                })  // conn.getConnection()
                .catch( (err) => {
                    resultHandler(err, undefined);
                });
   }

}

module.exports = Shipping;

