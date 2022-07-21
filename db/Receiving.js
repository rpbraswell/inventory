
const pool = require("./db");
const Item = require("./Item");

class Receiving {

   constructor(received) {
      this.id         = received.id;
      this.itemId     = received.itemId;
      this.qty        = received.qty ? Number(received.qty) : received.qty;
      this.receivedAt = received.receivedAt;
   }

   static receiveItem( item, qty, resultHandler ) {
    console.log('---in receiveItem()---')
    pool.getConnection() 
    .then( (conn) => {
        conn.beginTransaction()
        .then( () => {
           let received = new Receiving({itemId: item.id, qty: qty});
           received.insert(conn, (receive) => {
                   if( receive instanceof Receiving ) {
                        console.log("--- inserted Receiving record ---");
                       item.qty += qty;
                       if( item.qty < 0 ) {
                           item.qty = 0;
                       }
                       item.update(conn, (res) => {
                           if( res instanceof Item) {
                                console.log('item updated successfully')
                               conn.commit()
                               .then( () => {
                                    resultHandler(receive);
                               })
                               .catch( (err) => {
                                    resultHandler(err);
                               })
                               .finally( () => {
                                    conn.end();
                               });
                           } else {
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
                         conn.rollback()
                         .then( () => {
                             console.log("successfully rolled back transaction");
                         })
                         .catch( (err) => {
                              console.log(err);
                         })
                         .finally( () => {
                              resultHandler(new Error("error inserting new receiving record ${receive.message}"));
                              conn.end();
                         });
                   }
                });   // received.insert()
            })  // conn.beginTransaction
            .catch( (err) => {
                resultHandler(err);
            });
         })  // conn.getConnection()
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

   /*
    *  Get the sum of the receiving records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
   static intervalReceived( days = 30, resultHandler ) {
       let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(r.qty) as 'Received', i.qty as 'On Hand' from receiving r, items i where r.itemId = i.id and r.receivedAt > date_sub(current_date, interval ${days} day) group by r.itemId order by i.name,i.itemClass,i.itemType`;
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

module.exports = Receiving;

