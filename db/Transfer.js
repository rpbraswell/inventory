const pool = require("./db");
const Item = require("./Item");

class Transfer {

   constructor(transfer) {
      this.id            = transfer.id;
      this.itemId        = transfer.itemId;
      this.toClass       = transfer.toClass;
      this.qty           = transfer.qty ? Number(transfer.qty) : transfer.qty;
      this.split         = transfer.split ? true : false;
      this.transferredAt = transfer.transferredAt;
   }

   static transferItem(item, qty, toClass, split, resultHandler) {
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                        console.log("---- beginning transaction ---");
                        let splitQty = split ? qty * item.pkgQty : qty;
                        let transfer = new Transfer({itemId: item.id,  toClass: toClass, qty: qty, split: split});
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
                                                toItem.qty += splitQty;
                                                toItem.update(conn, (res1) => {
                                                    if( res1 instanceof Item ) {
                                                        console.log('---committing transfer transaction---');
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
                                                console.log('--- did not find to item so inserting one---');
                                                let newItem = new Item(item);
                                                newItem.id = undefined;
                                                newItem.qty = splitQty;
                                                newItem.itemClass = toClass;
                                                newItem.pkgQty = 1;
                                                newItem.lastUpdate = undefined;
                                                // console.log(newItem);
                                                newItem.insert(conn, (toItem) => {
                                                    if( toItem instanceof Item) {
                                                        console.log('---committing new to item---');
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
        // console.log(this);
          conn.query("insert into transfers (itemId, qty, toClass, split) values (?,?,?,?)", [this.itemId, this.qty, this.toClass, this.split])
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
       let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', sum(t.qty) as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', DATE_FORMAT(max(t.transferredAt), "%M %d %Y %r") as 'Last Transfer' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) group by t.itemId,t.toClass order by i.name,i.itemClass,i.itemType`;
       pool.getConnection()
       .then( conn => { 
          conn.query(sql)
          .then( (res) => {
               resultHandler(res);
          })
          .catch( (err) => {
               resultHandler(err);
          })
          .finally( () => {
             conn.end();
          })
        })
       .catch( (err) => {
            resultHandler(err);
       });


    }

     /*
    *  Get the sum of the transfer records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
     static intervalTransferredDetails( days = 30, sortField = "name", resultHandler ) {
        let orderBy = `order by i.name,i.itemClass,i.itemType`;
        if( sortField != "name") {
            orderBy = `order by ${sortField}`;
        }
        let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', t.qty as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', t.split as 'Split', DATE_FORMAT(t.transferredAt,"%M %d %Y %r") as 'Transferred At' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) ${orderBy}`;
        pool.getConnection()
        .then( conn => { 
           conn.query(sql)
           .then( (res) => {
                resultHandler(res);
           })
           .catch( (err) => {
                resultHandler(err);
           })
           .finally( () => {
              conn.end();
           })
         })
        .catch( (err) => {
            resultHandler(err);
        });
    }

    static intervalTransferredCSV( days = 30, file, resultHandler ) {
        let sql = `(select 'Name', 'Class', 'Type', 'Unit', 'Units Transferred', 'Qty per Unit', 'To Class', 'Last Transfer') union (select i.name, i.itemClass, i.itemType, u.unit, sum(t.qty), i.pkgQty, t.toClass, DATE_FORMAT(max(t.transferredAt),"%M %d %Y %r")  from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) group by t.itemId order by i.name,i.itemClass,i.itemType) INTO OUTFILE '${file}' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED by '"' LINES TERMINATED BY '\n'`;
        console.log(`sql: ${sql}`);
        pool.getConnection()
        .then( conn => { 
            conn.query(sql)
            .then( (res) => {
                resultHandler("success");
            })
            .catch( (err) => {
                resultHandler(err);
            })
            .finally( () => {
                conn.end();
        })
     })
    .catch( (err) => {
        resultHandler(err);
    });
    }
}


module.exports = Transfer;
