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
      this.pkgQty     = item.pkgQty   ? Number(item.pkgQty)     : 1;
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
       if( typeof this.qty !== 'number' || this.qty < 0 ) {
           messages.push("you cannot have a negative qty on hand");
       }
       if( !this.itemClass || this.itemClass == '-select-') {
           messages.push("you must select a valid item class");
       }   
       if( !this.itemType || this.itemType == '-select-') {
           messages.push("you must select a valid item type");
       }

       if( operation == 'insert' ) {
          if( this.id ) {
             messages.push("you cannot insert an item with an id");
          } else {
             Item.findByNameAndClassAndType(this.name, this.itemClass, this.itemType, (item) => {
                  if( item instanceof Item ) {
                     messages.push(`item with name '${this.name}' and type '${this.itemType}' and class '${this.itemClass}' already exists`);
                  }
             });
          }
       } else if( operation == 'update' ) {
          if( !this.id ) {
            messages.push("update requires a valid id");
          }
       }
       resultHandler ( { ok: messages.length == 0, messages } );
   }

   update(connection, resultHandler) {
      if( !connection ) {
          pool.getConnection()
          .then( newConnection => { 
            this._update(newConnection, true, resultHandler);
          })
          .catch( (err) => {
              resultHandler(err, undefined);
          });
      } else {
          this._update(connection, false, resultHandler);
      }
   }

   _update(conn, endConnection, resultHandler) {
          conn.query("update items set name = ?,  category = ?, unit = ?, pkgQty = ?, qty = ? where id = ?", [this.name, this.category, this.unit, this.pkgQty, this.qty, this.id]) 
          .then( res =>  {
                resultHandler(undefined, this);
          })
          .catch( (err) => {
                resultHandler(err, undefined);
          })
          .finally( () => {
              endConnection === true && conn.end();
          });
   }

    insert(connection, resultHandler) {
        if( !connection ) {
            pool.getConnection()
            .then( newConnection => { 
                this._insert(newConnection, true, resultHandler);
            })
            .catch( (err) => {
               resultHandler(err, undefined);
            });
        } else {
            this._insert(connection, false, resultHandler);
        }
   }

   _insert(conn, endConnection, resultHandler) {
          conn.query("insert into items (name, itemClass, itemType, category, unit, pkgQty, qty) values (?,?,?,?,?,?,?)", 
                 [this.name, this.itemClass, this.itemType, this.category, this.unit, this.pkgQty, this.qty])
          .then( (res) =>  {
                this.id = res.insertId;
                resultHandler(undefined, this);
          })
          .catch( (err) => {
                resultHandler(err, undefined);
          })
          .finally( () => {
              endConnection === true && conn.end();
          });
   }

   static findByNameAndClassAndType(name, itemClass, itemType, resultHandler ) {
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where name = ? and itemClass = ? and itemType = ?', [name, itemClass, itemType] )
              .then( row => {
                  if( row.length == 0 ) {
                      resultHandler(undefined, null );
                  } else {
                      resultHandler(undefined, new Item(row[0]));
                  }
              })
              .catch( err => {
                  resultHandler(err, undefined);
              })
              .finally( () => {
                  conn.end();
              });
          })
          .catch( err => {
              resultHandler(err, undefined);
          });
   }

   static getItemById(id, resultHandler ) {
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where id = ?', id)
              .then( row => {
                  if( row.length == 0 ) {
                      resultHandler(undefined, null );
                  } else {
                      resultHandler(undefined, new Item(row[0]));
                  }
              })
              .catch( err => {
                  resultHandler(err, undefined);
              })
              .finally( () => {
                  conn.end();
              });
          })
          .catch( err => {
              resultHandler(err, undefined);
          });
   }


  
   static deleteItem(id, resultHandler ) {
      pool.getConnection()
      .then( conn => { 
          conn.query("delete from items where id = ?", Number(id))
          .then( result =>  {
                resultHandler(undefined, result);
          })
          .catch( (err) => {
                resultHandler(err, undefined);
          })
          .finally( () => {
               conn.end();
          });
      })
      .catch( (err) => {
            resultHandler(err, undefined);
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
          .then( types =>  {
              resultHandler(undefined, Item._parseEnumValues(types));
          })
          .catch( (err) => {
              resultHandler(err, undefined);
          })
          .finally( () => {
             conn.end();
          });
      })
      .catch( (err) => {
            resultHandler(err, undefined);
       });
   }

   static getClassValues(resultHandler) {
      pool.getConnection()
      .then( conn => { 
          conn.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemClass';")
          .then( classes =>  {
              resultHandler(undefined, Item._parseEnumValues(classes));
          })
          .catch( (err) => {
              resultHandler(err, undefined);
          })
          .finally( () => {
             conn.end();
          });
      })
      .catch( (err) => {
          resultHandler(err, undefined);
       });
    }

   
}



module.exports = Item;

