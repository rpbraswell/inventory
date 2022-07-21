const pool = require("./db");
const Item = require("./Item");

class Transfer {

   constructor(transfer) {
      this.id            = transfer.id;
      this.itemId        = transfer.itemId;
      this.toClass       = transfer.toClass;
      this.qty           = transfer.qty ? Number(transfer.qty) : transfer.qty;
      this.transferredAt = transfer.transferredAt;
   }

   static transferItem(item, qty, toClass, resultHandler) {
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                        console.log("---- beginning transaction ---");
                        qty = Number(qty);
                        let transfer = new Transfer({itemId: item.id,  toClass: toClass, qty: qty});
                        transfer.insert(conn, (trans) => {
                            if( trans instanceof Transfer ) {
                                console.log("---- inserted Transfer record ---");
                                item.qty -= qty;
                                item.qty = item.qty < 0 ? 0 : item.qty;
                                item.update(conn, (res) => {
                                    if( res instanceof Item) {
                                        console.log("--- looking up to item ---");
                                        Item.findByNameAndClassAndType( item.name, toClass, item.itemType, (toItem) => {
                                            if( toItem instanceof Item ) {
                                                toItem.qty += qty;
                                                toItem.update(conn, (res1) => {
                                                    if( res1 instanceof Item ) {
                                                        console.trace('---committing transfer transaction---');
                                                        conn.commit()
                                                        .then( () => {
                                                             console.log("--- successfully commited transaction ---");
                                                             resultHandler(res1);
                                                        })
                                                        .catch( (err) => {
                                                             resultHandler(err);
                                                        })
                                                     }
                                                  })
                                            } else {
                                                console.trace('--- did not find to item so inserting one---');
                                                let newItem = new Item(item);
                                                newItem.id = undefined;
                                                newItem.qty = qty;
                                                newItem.itemClass = toClass;
                                                newItem.lastUpdate = undefined;
                                                console.log(newItem);
                                                newItem.insert(conn, (toItem) => {
                                                    if( toItem instanceof Item) {
                                                        console.trace('---committing new to item---');
                                                        conn.commit()
                                                        .then( () => {
                                                             console.log("--- successfully commited transaction ---");
                                                             resultHandler(toItem);
                                                        })
                                                        .catch( (err) => {
                                                             resultHandler(err);
                                                        });
                                                    } else {
                                                        console.log('--- rolling back transaction ---')
                                                        conn.rollback();
                                                        resultHandler(toItem);
                                                    }
                                                })
                                            }
                                        });  // Item.findByNameAndClassAndType
                                    }
                                });  // item.update
                            }
                        })  // transfer.insert
                    }) // begin transaction
                    .catch( (err) => {
                        resultHandler(err);
                    });
                })  // get connnection
                .catch( (err) => {
                    resultHandler(err);
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
         console.log("--- using existing connection to insert into transfers ---");
         this._insert(connection, resultHandler, false);
      }
   }

   _insert(conn, resultHandler, endConnection) {
        console.log(this);
          conn.query("insert into transfers (itemId, qty, toClass) values (?,?,?)", [this.itemId, this.qty, this.toClass])
          .then( (res) =>  {
                console.log("success inserting transfers");
                this.id = res.insertId;
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("got error inserting transfers");
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("--- ending connection afer insedrting transfers record ---");
                  conn.end();
              }
          });
   }

   /*
    *  Get the sum of the receiving records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
   static intervalTransfer( days = 30, resultHandler ) {
       let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(t.qty) as 'Transferred', t.toClass as 'To' from transfers t, items i where t.itemId = i.id and t.transferredAt > date_sub(current_date, interval ${days} day) group by t.itemId,t.toClass order by i.name,i.itemClass,i.itemType`;
       pool.getConnection()
       .then( conn => { 
          conn.query(sql)
          .then( (res) => {
               resultHandler(res);
          })
          .catch( (err) => {
               throw err;
          })
        })
       .catch( (err) => {
        resultHandler(err);
       });
   }
}

module.exports = Transfer;
