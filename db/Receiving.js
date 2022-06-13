
const pool = require("./db");
const Item = require("./Item");

class Receiving {

   constructor(received) {
      this.id         = received.id;
      this.itemId     = received.itemId;
      this.qty        = received.qty ? Number(received.qty) : received.qty;
      this.receivedAt = received.receivedAt;
   }


   static receiveItem(receivedQty, itemType, itemClass, itemName, resultHandler) {
       console.log(`receiveItem() looking for item: ${itemName} ${itemClass} ${itemType}`)
       
       Item.findByNameAndClassAndType(itemName, itemClass, itemType, (item) => {
           if( item instanceof Item ) {
                console.log("---- found ${itemName} ---");
                for( const key in item ) {
                    console.log(`${key}: ${item[key]}`);
                }
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                       console.log("---- beginning transaction ---");
                       let qty = Number(receivedQty);
                       let received = new Receiving({itemId: item.id, qty: receivedQty});
                       received.insert(conn, (rec) => {
                               if( rec instanceof Receiving ) {
                                   console.log("---- inserted Receiving record ---");
                                   for( const key in rec ) {
                                       console.log(`${key}: ${rec[key]}`);
                                   }
                                   console.log("---- updating ${itemName}  ---");
                                   item.qty += receivedQty;
                                   item.update(conn, (res) => {
                                       if( res instanceof Item) {
                                           console.log("--- committing transaction ---");
                                           conn.commit()
                                           .then( () => {
                                                console.log("--- successfully commited transaction ---");
                                                resultHandler(rec);
                                           })
                                           .catch( (err) => {
                                                resultHandler(err);
                                           })
                                           .finally( () => {
                                                conn.end();
                                           });
                                       } else {
                                           console.log("--- rolling back transaction ---");
                                           conn.rollback()
                                           .then( () => {
                                                console.log("successfully rolled back transaction");
                                           })
                                           .catch( (err) => {
                                                console.log(err);
                                           })
                                           .finally( () => {
                                                conn.end();
                                           });
                                           resultHandler(res);
                                       }
                                   });
                               } else {
                                     console.log("--- rolling back transaction ---");
                                     conn.rollback()
                                     .then( () => {
                                         console.log("successfully rolled back transaction");
                                     })
                                     .catch( (err) => {
                                          console.log(err);
                                     })
                                     .finally( () => {
                                          resultHandler(new Error("error inserting new receiving record ${rec.message}"));
                                          conn.end();
                                     });
                               }
                       });
                       
                    })
                    .catch( (err) => {
                        resultHandler(err);
                    });
                })
                .catch( (err) => {
                    resultHandler(err);
                });
           } else {
               resultHandler(new Error("unable to find item ${itemName}"));
           }
       });
   }

   insert(connection, resultHandler) {

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
         console.log("--- using existing connection to insert into receiving ---");
         this._insert(connection, resultHandler, false);
      }
   }

   _insert(conn, resultHandler, endConnection) {
          conn.query("insert into receiving (itemId, qty) values (?,?)", [this.itemId, this.qty])
          .then( (res) =>  {
                this.id = res.insertId;
                console.log("new receiving record is is " + res.insertId);
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("got error inserting receiving");
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("--- ending connection afer insedrting receiving record ---");
                  conn.end();
              }
          });
   }

}

module.exports = Receiving;

