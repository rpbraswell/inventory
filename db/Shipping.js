
const pool = require("./db");
const Item = require("./Item");

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

   static shipItem( item, qty, resultHandler ) {
                console.log('---in shipItem()---')
                pool.getConnection() 
                .then( (conn) => {
                    conn.beginTransaction()
                    .then( () => {
                       let shipped = new Shipping({itemId: item.id, qty: qty});
                       shipped.insert(conn, (ship) => {
                               if( ship instanceof Shipping ) {
                                    console.log("--- inserted Shipping record ---");
                                   item.qty -= qty;
                                   if( item.qty < 0 ) {
                                       item.qty = 0;
                                   }
                                   item.update(conn, (res) => {
                                       if( res instanceof Item) {
                                            console.log('item updated successfully')
                                           conn.commit()
                                           .then( () => {
                                                resultHandler(ship);
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
                                          resultHandler(new Error("error inserting new shipping record ${ship.message}"));
                                          conn.end();
                                     });
                               }
                       });   // shipped.insert()
                    })  // conn.beginTransaction
                    .catch( (err) => {
                        resultHandler(err);
                    });
                })  // conn.getConnection()
                .catch( (err) => {
                    resultHandler(err);
                });
   }

   /*
    *  Get the sum of the receiving records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
   static intervalShipped( days = 30, resultHandler ) {
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(s.qty) as 'Shipped', i.qty as 'On Hand', DATE_FORMAT(max(s.shippedAt),"%M %d %Y %r") as 'Last Ship' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) group by s.itemId order by i.name,i.itemClass,i.itemType`;
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
    *  Get the sum of the receiving records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
   static intervalShippedDetails( days = 30, sortField = "name", resultHandler ) {
    let orderBy = `order by i.name,i.itemClass,i.itemType`;
    if( sortField != "name") {
        orderBy = `order by ${sortField}`;
    }
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', s.qty as 'Shipped', DATE_FORMAT(s.shippedAt,"%M %d %Y %r") as 'Shipped At' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) ${orderBy}`;
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

    static intervalShippedCSV( days = 30, file, resultHandler ) {
        let sql = `(select 'Name', 'Class', 'Type', 'Shipped', 'On Hand', 'Last Ship') union (select i.name, i.itemClass, i.itemType, sum(s.qty), i.qty, DATE_FORMAT(max(s.shippedAt),"%M %d %Y %r")  from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) group by s.itemId order by i.name,i.itemClass,i.itemType) INTO OUTFILE '${file}' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED by '"' LINES TERMINATED BY '\n'`;
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


module.exports = Shipping;

