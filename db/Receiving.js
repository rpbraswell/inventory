
const pool = require("./db");
const Item = require("./Item");

class Receiving {

   constructor(received) {
      this.id         = received.id ? Number(received.id) : undefined;
      this.itemId     = received.itemId ? Number(received.itemId) : undefined;
      this.qty        = received.qty ? Number(received.qty) : undefined;
      this.receivedAt = received.receivedAt;
   }

   static receiveItem( item, qty, resultHandler ) {
    pool.getConnection() 
    .then( (conn) => {
        conn.beginTransaction()
        .then( () => {
           let received = new Receiving({itemId: item.id, qty: qty});
           received.insert(conn, (err, receive) => {
                   if(err) {
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
                        item.qty += qty;
                        if( item.qty < 0 ) {
                             item.qty = 0;
                         }
                         item.update(conn, (err, item) => {
                             if(err) {
                                conn.rollback()
                                .then( () => {
                                    console.log("successfully rolled back transaction");
                                })
                                .catch( (rollbackErr) => {
                                      console.log(rollbackErr);
                                })
                                .finally( () => {
                                    conn.end();
                                    resultHandler(err, undefined)
                                });
                        } else {
                            conn.commit()
                            .then( () => {
                                resultHandler(undefined, receive);
                            })
                            .catch( (err) => {
                                 resultHandler(err, undefined);
                            })
                            .finally( () => {
                                 conn.end();
                            });
                        }
                    });
                   }
                });   // received.insert()
            })  // conn.beginTransaction
            .catch( (err) => {
                resultHandler(err, undefined);
            });
         })  // conn.getConnection()
        .catch( (err) => {
             resultHandler(err, undefined);
        });
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
          conn.query("insert into receiving (itemId, qty) values (?,?)", [this.itemId, this.qty])
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

}

module.exports = Receiving;

