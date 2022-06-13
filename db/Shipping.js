
const pool = require("./db");

class Shipping {


   constructor(shipped) {
      this.id         = shipped.id;
      this.itemId     = shipped.itemId;
      this.qty        = shipped.qty ? Number(shipped.qty) : shipped.qty;
      this.shippedAt = shipped.shippedAt;
   }

   insert(connection, resultHandler) {

      console.log("shipping validation successful for insertion");
      if( !connection ) {
          console.log("getting new connection");
          pool.getConnection()
          .then( conn => { 
             this._insert(connection, resultHandler, true);
          })
          .catch( (err) => {
              resultHandler(err);
          });
      } else {
         this._insert(connection, resultHandler, false);
      }
   }

   _insert(conn, resultHandler, endConnection) {
          conn.query("insert into shipping (itemId, qty) values (?,?)", 
                 [this.itemId, this.qty])
          .then( res =>  {
                this.id = res.insertId;
                console.log("got good result: " + res);
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("got error inserting shipping");
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("ending connection");
                  conn.end();
              }
          });
   }

   static shipItem(shippedQty, itemType, itemClass, itemName, resultHandler) {
       
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
                       let shipped = new Shipping({itemId: item.id, qty: shippedQty});
                       shipped.insert(conn, (ship) => {
                               if( ship instanceof Shipping ) {
                                   console.log("---- inserted Shipping record ---");
                                   for( const key in ship ) {
                                       console.log(`${key}: ${ship[key]}`);
                                   }
                                   console.log("---- updating ${itemName}  ---");
                                   item.qty -= shippedQty;
                                   if( item.qty < 0 ) {
                                       item.qty = 0;
                                   }
                                   item.update(conn, (res) => {
                                       if( res instanceof Item) {
                                           console.log("--- committing transaction ---");
                                           conn.commit()
                                           .then( () => {
                                                console.log("--- successfully commited transaction ---");
                                                resultHandler(ship);
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
                                          resultHandler(new Error("error inserting new shipping record ${ship.message}"));
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

}


module.exports = Shipping;

