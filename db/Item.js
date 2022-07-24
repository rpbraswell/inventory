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
             // console.log("id is null checking for duplicate name"); 
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
          // console.log("getting new connection");
          pool.getConnection()
          .then( newConnection => { 
            this._update(newConnection, resultHandler, true);
          })
          .catch( (err) => {
              resultHandler(err);
          });
      } else {
          this._update(connection, resultHandler, false);
      }
   }

   _update(conn, resultHandler, endConnection) {
          conn.query("update items set name = ?,  category = ?, unit = ?, qty = ? where id = ?", [this.name, this.category, this.unit, this.qty, this.id]) 
          .then( res =>  {
                resultHandler(this);
          })
          .catch( (err) => {
                throw err;
          })
          .finally( () => {
              endConnection && conn.end();
          });
   }

    insert(connection, resultHandler) {
        if( !connection ) {
            console.log("getting new connection");
            pool.getConnection()
            .then( newConnection => { 
                this._insert(newConnection, resultHandler, true);
            })
            .catch( (err) => {
               resultHandler(err);
            });
        } else {
            this._insert(connection, resultHandler, false);
        }
   }

   _insert(conn, resultHandler, endConnection) {
          conn.query("insert into items (name, itemClass, itemType, category, unit, qty) values (?,?,?,?,?,?)", 
                 [this.name, this.itemClass, this.itemType, this.category, this.unit, this.qty])
          .then( (res) =>  {
                this.id = res.insertId;
                resultHandler(this);
          })
          .catch( (err) => {
                resultHandler(err);
          })
          .finally( () => {
              endConnection && conn.end();
          });
   }

   static findByNameAndClassAndType(name, itemClass, itemType, resultHandler ) {
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where name = ? and itemClass = ? and itemType = ?', [name, itemClass, itemType] )
              .then( row => {
                  if( row.length == 0 ) {
                      resultHandler( {} );
                  } else {
                      resultHandler(new Item(row[0]));
                  }
              })
              .catch( err => {
                  resultHandler(err);
              })
              .finally( () => {
                  conn.end();
              });
          })
          .catch( err => {
              resultHandler(err);
          });
   }

   static getItemById(id, resultHandler ) {
      pool.getConnection()
          .then( conn => {
              conn.query('select * from items where id = ?', id)
              .then( row => {
                  if( row.length == 0 ) {
                      resultHandler( {} );
                  } else {
                      resultHandler(new Item(row[0]));
                  }
              })
              .catch( err => {
                    console.log('got error getting item by Id')
                  resultHandler(err);
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
            items.forEach( (item) => {
               itemNames.push(item[0]);
            });
            resultHandler(itemNames);
        })
   }

   static deleteItem(id, resultHandler ) {
      pool.getConnection()
      .then( conn => { 
          conn.query("delete from items where id = ?", Number(id))
          .then( res =>  {
                resultHandler(res);
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

   static getClassValues(resultHandler) {
      pool.getConnection()
      .then( conn => { 
          conn.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemClass';")
          .then( res =>  {
              resultHandler(Item._parseEnumValues(res));
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

}

module.exports = Item;

