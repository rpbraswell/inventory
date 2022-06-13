let pool = require("./db.js");

class Item {

   constructor(item) {
      this.id         = item.id       ? Number(item.id)         : undefined;
      this.name       = item.name     ? item.name.toLowerCase() : undefined;
      this.itemClass  = item.itemClass;
      this.itemType   = item.itemType;
      this.category   = item.category ? Number(item.category)   : 0;
      this.unit       = item.unit     ? Number(item.unit)       : 0;
      this.qty        = item.qty      ? Number(item.qty)        : 0;
      this.lastUpdate = item.lastUpdate;
   }

   isValid(operation, resultHandler) {
       let messages = [];

       if( !this.category || typeof this.category !== 'number' || this.category < 1 ) {
           messages.push("you must select a valid caetegory");
       }
       if( !this.unit || typeof this.unit !== 'number' || this.unit < 1 ) {
           messages.push("you must select a valid unit");
       }
       if( !this.qty || typeof this.qty !== 'number' || this.qty < 0 ) {
           messages.push("you cannot have a negative qty on hand");
       }
       if( !this.itemClass || this.itemClass == '-select-') {
           messages.push("you must select a valid item class");
       }   
       if( !this.itemType || this.itemType == '-select-') {
           messages.push("you must select a valid item type");
       }

       if( operation == 'insert' ) {
          console.log('operation is insert');
          if( this.id ) {
             messages.push("you cannot insert an item with an id");
             resultHandler ( {ok: messages.length == 0, messages } );
          } else {
             console.log("id is null checking for duplicate name"); 
             Item.findByNameAndClassAndType(this.name, this.itemClass, this.itemType, (item) => {
                  if( item instanceof Item ) {
                     messages.push(`item with name '${this.name}' and type '${this.itemType}' and class '${this.itemClass}' already exists`);
                  } else {
                     console.log(JSON.stringify(item));
                  }
                  resultHandler ( { ok: messages.length == 0, messages } );
             });
          }
       } else {
           resultHandler ( { ok: messages.length == 0, messages } );
       } 
   }

   updateOK() {
       return this.id;
   }

   update(connection, resultHandler) {
      let conn = connection;
      if( this.updateOK() == false ) {
          resultHandler(new Error("validation failed for updating item"));
          return false;
      }
      if( !connection ) {
          console.log("getting new connection");
          pool.getConnection()
          .then( conn => { 
             this._update(conn, resultHandler, true);
          })
          .catch( (err) => {
              resultHandler(err);
          });
      } else {
         this._update(conn, resultHandler, false);
      }
   }

   _update(conn, resultHandler, endConnection) {
          console.log(this)
          conn.query("update items set category = ?, unit = ?, qty = ? where id = ?", [this.category, this.unit, this.qty, this.id]) 
          .then( res =>  {
                console.log("got good update result");
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("_update(): got error updating item");
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("ending connection");
                  conn.end();
              }
          });
   }

   delete(id, connection, resultHandler) {
      let conn = connection;
      if( !connection ) {
          console.log("getting new connection");
          pool.getConnection()
          .then( conn => { 
             this._update(conn, resultHandler, true);
          })
          .catch( (err) => {
              resultHandler(err);
          });
      } else {
         this._delete(Number(id), conn, resultHandler, false);
      }
   }

   _delete(id, conn, resultHandler, endConnection) {
          conn.query("delete from items where id = ?", id) 
          .then( res =>  {
                console.log("got good delete result");
                resultHandler(res);
          })
          .catch( (err) => {
                console.log(`got error deleting item ${id}`);
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  console.log("ending connection");
                  conn.end();
              }
          });
   }

   insertOK() {
       if( !this.id && 
           typeof this.name === 'string' && 
           typeof this.category === 'number' && 
           typeof this.unit === 'number' && 
           (!this.qty || typeof this.qty === 'number') ) {
           return true;
       } else {
           return false;
       }
   }

   insert(connection, resultHandler) {

      if( this.insertOK() == false ) {
          resultHandler(new Error("validation failed for inserting item"));
          return false;
      }

      console.log("item validation successful for insertion");
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
         this._insert(conn, resultHandler, false);
      }
   }

   _insert(conn, resultHandler, endConnection) {
          conn.query("insert into items (name, itemClass, itemType, category, unit, qty) values (?,?,?,?,?,?)", 
                 [this.name, this.itemClass, this.itemType, this.category, this.unit, this.qty])
          .then( (res) =>  {
                this.id = res.insertId;
                console.log("got good result: " + res);
                resultHandler(this);
          })
          .catch( (err) => {
                console.log("got error inserting item");
                resultHandler(err);
          })
          .finally( () => {
              if( endConnection === true ) {
                  conn.end();
              }
          });
   }

   static findByNameAndClassAndType(name, itemClass, itemType, resultHandler ) {
      console.log(`findByNameAndClassAndType(): looking for ${name} ${itemClass} ${itemType}`)
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where name = ? and itemClass = ? and itemType = ?', [name, itemClass, itemType] )
              .then( row => {
                  console.log('row: ' + JSON.stringify(row))
                  if( row.length == 0 ) {
                      resultHandler( new Error("item not found"));
                  } else {
                      let item = new Item(row[0]);
                      console.log('findByNameAndClassAndType(): item ' + JSON.stringify(item));
                      resultHandler(item); 
                  }
              })
              .catch( err => {
                  console.log('got error fetching item');
                  resultHandler('error reading from the items table: ' + err.message);
              })
              .finally( () => {
                  conn.end();
              });
          })
          .catch( err => {
              console.log('got error getting connection');
              resultHandler(err);
          });
   }

   static getItemById(id, resultHandler ) {
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where id = ?', id)
              .then( row => {
                  if( row.length == 0 ) {
                      resultHandler( new Error("item not found"));
                  } else {
                      let item = new Item(row[0])
                      console.log('getItemsById(): ' + JSON.stringify(item))
                      resultHandler(item); 
                  }
              })
              .catch( err => {
                  resultHandler('error reading from the items table: ' + err.message);
              })
              .finally( () => {
                  conn.end();
              });
          })
          .catch( err => {
              resultHandler(err);
          });
   }

   static getItems( resultHandler ) {
      pool.getConnection()
      .then( conn => {
            let sql = 'select i.id,i.name,i.itemClass,i.itemType,c.category,u.unit,i.qty,DATE_FORMAT(i.lastUpdate,"%M %d %Y %r") from items i, categories c, units u where i.category=c.id and i.unit=u.id order by i.name';
            conn.query( {rowsAsArray: true,  sql: sql } )
            .then( rows => {
                 resultHandler(rows);
            })
            .catch( (err) => {
                 resultHandler(err);
            })
            .finally( () => {
               conn.end();
            });
      })
      .catch( (err) => {
           resultHandler(err);
      });
   }

   static getItemNames( resultHandler ) {
        let itemNames = [];
        Item.getItems( (items) => {
            if( items instanceof Error ) {
                resultHandler(err);
                return;
            }
            items.forEach( (item) => {
               itemNames.push(item[0]);
            });
            resultHandler(itemNames);
        })
   }

   static deleteItem(id, resultHandler ) {
      console.log(JSON.stringify(id));
      console.log("getting new connection");
      pool.getConnection()
      .then( conn => { 
          conn.query("delete from items where id = ?", Number(id))
          .then( res =>  {
                console.log("got good delete result");
                resultHandler(res);
          })
          .catch( (err) => {
                console.log("got error deleting item");
                resultHandler(err);
          })
          .finally( () => {
               console.log("ending connection");
               conn.end();
          });
      })
      .catch( (err) => {
              resultHandler(err);
       });
   }

   static _parseEnumValues(enumValues) {
       let vals = enumValues[0].enumValues;
       let valArr = vals.match(/([a-zA-Z]+)/g)
       return valArr.slice(1);
   }

   static getTypeValues(resultHandler) {
      pool.getConnection()
      .then( conn => { 
          conn.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemType';")
          .then( res =>  {
              //console.log(res);
              resultHandler(Item._parseEnumValues(res));
          })
          .catch( (err) => {
              console.log("got error getting type values");
              resultHandler(err);
          })
          .finally( () => {
             console.log("ending connection");
             conn.end();
          });
      })
      .catch( (err) => {
            resultHandler(err);
       });
   }

   static getClassValues(resultHandler) {
      pool.getConnection()
      .then( conn => { 
          conn.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemClass';")
          .then( res =>  {
              // console.log(res);
              resultHandler(Item._parseEnumValues(res));
          })
          .catch( (err) => {
              console.log("got error getting class values");
              resultHandler(err);
          })
          .finally( () => {
             console.log("ending connection");
             conn.end();
          });
      })
      .catch( (err) => {
          resultHandler(err);
       });
    }

}

module.exports = Item;

