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

   static transferItem(item, toItem, qty, resultHandler) {
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                        console.log("---- beginning transaction ---");
                        let transfer = new Transfer({itemId: item.id,  toClass: toItem.itemClass, qty: qty, split: item.pkgQty > toItem.pkgQty ? true : false});
                        console.log('--- inserting transfer record ---');
                        transfer.insert(conn, (err, trans) => {
                            if(err) {
                                console.log('---- rolling back transaction (transfer insert) ---');
                                conn.rollback();
                                conn.end();
                                resultHandler(err, undefined);
                            } else {
                                console.log("---- inserted Transfer record ---");
                                item.qty -= qty;
                                item.qty = item.qty < 0 ? 0 : item.qty;
                                console.log('---- updating item ----');
                                item.update(conn, (err, resItem) => {
                                    if(err) {
                                        console.log('--- rolling back transaction ---');
                                        conn.rollback();
                                        conn.end();
                                        resultHandler(err, undefined);
                                    } else {
                                        console.log(`---- item.pkgQty: ${item.pkgQty}, toItem.pkgQty: ${toItem.pkgQty} toItem.qty: ${toItem.qty} ----`);
                                        toItem.qty  += (item.pkgQty*qty)/toItem.pkgQty;
                                        console.log('toItem.qty: ', toItem.qty);
                                        console.log('---- updating toItem ----');
                                        toItem.update(conn, (err, resToItem) => {
                                           if(err) {
                                               console.log('---- rolling back transaction ---');
                                               conn.rollback();
                                               conn.end();
                                               resultHandler(err, undefined);
                                           } else {
                                               conn.commit();
                                               conn.end();
                                               resultHandler(undefined, resToItem);
                                           }
                                       }) //toItem.update
                                    }
                                });  // item.update
                            }
                        })  // transfer.insert
                    }) // begin transaction
                    .catch( (err) => {
                        console.log('---- error beginning transaction ----');
                        conn.end();
                        resultHandler(err, undefined);
                    })
                })  // get connnection
                .catch( (err) => {
                    resultHandler(err, undefined);
                });
   }

   insert(connection, resultHandler) {

      if( !connection ) {
          console.log("getting new connection");
          pool.getConnection()
          .then( conn => { 
             this._insert(conn, true, resultHandler);
          })
          .catch( (err) => {
              resultHandler(err, undefined);
          });
      } else {
         console.log("--- using existing connection to insert into transfers ---");
         this._insert(connection, false, resultHandler);
      }
   }

   _insert(conn, endConnection, resultHandler) {
        // console.log(this);
          conn.query("insert into transfers (itemId, qty, toClass, split) values (?,?,?,?)", [this.itemId, this.qty, this.toClass, this.split])
          .then( (res) =>  {
                console.log("success inserting transfers");
                this.id = res.insertId;
                resultHandler(undefined, this);
          })
          .catch( (err) => {
                console.log("got error inserting transfers");
                resultHandler(err, undefined);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("--- ending connection afer insedrting transfers record ---");
                  conn.end();
              }
          });
   }
}

module.exports = Transfer;
