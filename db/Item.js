import pool from "./db.js";

import Shipping from './Shipping.js';
import Receiving from './Receiving.js';
import Transfer from './Transfer.js';

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

   async isValid(operation) {
        let messages = [];
        if( !this.name || typeof this.name !== 'string' || this.name.length < 2) {
            messages.push('name must be a string of at least 2 characters')
        }
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
        if( !this.pkgQty || typeof this.pkgQty !== 'number' || this.pkgQty < 1) {
            messages.push("pkgQty must be a number greater than 0");
        }

        if( operation == 'insert' ) {
            if( this.id ) {
                messages.push("cannot insert an item with an id");
            } else {
                try { 
                    await Item.findByNameAndClassAndType(this.name, this.itemClass, this.itemType);
                    // if it does not reject then it is a duplicate
                    messages.push(`item with name '${this.name}' and type '${this.itemType}' and class '${this.itemClass}' already exists`);
                } catch(err) {}
            }
        } else if( operation == 'update' ) {
            if( !this.id ) {
                messages.push("update requires a valid id");
            }
        }
        if( messages.length > 0 ) {
            let err = new Error(`item validation for ${operation} failed`);
            err.ok = false;
            err.messages = messages;
            return Promise.reject(err);
        } else {
            return Promise.resolve( { ok: true} );
        }
   }

   async insert(connection) {
        await this.isValid("insert"); // throws an exception if not valid
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result = await conn.query("insert into items (name, itemClass, itemType, category, unit, pkgQty, qty) values (?,?,?,?,?,?,?)", 
            [this.name, this.itemClass, this.itemType, this.category, this.unit, this.pkgQty, this.qty])
            .finally( () => connection || conn.end());
        this.id = result.insertId;
        return Promise.resolve('success: 1 item inserted');
    }

   async update(connection) {
        await this.isValid("update");  // throws an exption if not valid
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result = await conn.query("update items set name = ?,  category = ?, unit = ?, pkgQty = ?, qty = ? where id = ?", [this.name, this.category, this.unit, this.pkgQty, this.qty, this.id])
                .finally( () => connection || conn.end());
        if( result.affectedRows != 1) {
            return Promise.reject(new Error(`error: failed to update item with id ${this.id}`));
        }
        return Promise.resolve('success: 1 item updated');
   }
   
   async delete(connection) {
        if(!this.id) {
            return Promise.reject(new Error('error: cannot delete an item without an id'))
        }
        let conn = connection;
        if( !connection ) {
             conn = await pool.getConnection();
        }
        let result = await conn.query("delete from items where id = ?", this.id)
                            .finally( () => connection || conn.end())
        if( result.affectedRows != 1 ) {
            return Promise.reject(new Error(`error: failed to delete item with id ${this.id}`));
        }
        delete this.id;
        return Promise.resolve("success: 1 item deleted");
   }

   async ship(qty) {
        let shippedQty = qty;
        if(!this.id) {
            return Promise.reject(new Error('error: cannot ship an item without an id'));
        }
        let shipped = new Shipping({itemId: this.id, qty: qty});
        let conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await shipped.insert(conn);
            if (this.qty < qty ) {
                shippedQty = this.qty;
            }
            this.qty -= shippedQty;
            await this.update(conn);
            await conn.commit();
            return Promise.resolve(`success: shipped ${shippedQty}`);
        } catch(err) {
            await conn.rollback();
            throw err;
        } finally {
            await conn.end();
        }
   }

   async receive(qty) {
        if(!this.id) {
            return Promise.reject(new Error('error: cannot receive an item without an id'));
        }
        let received = new Receiving({itemId: this.id, qty: qty});
        let conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await received.insert(conn);
            this.qty += qty;
            await this.update(conn);
            await conn.commit();
            return Promise.resolve(`success: received ${qty}`);
        } catch(err) {
            await conn.rollback();
            throw err;
        } finally {
            await conn.end();
        }
    }

    async transfer(toItem, qty) {
        let transferredQty = qty;
        if(!this.id) {
            return Promise.reject(new Error('error: cannot transfer an item without an id'));
        }
        if(!toItem.id) {
            return Promise.reject(new Error('error: cannot transfer to an item with no id'));
        }
        let conn = await pool.getConnection();
        try {
            let transfer = new Transfer({itemId: this.id,  toClass: toItem.itemClass, qty: qty, split: this.pkgQty > toItem.pkgQty ? true : false});
            await transfer.insert();
            if( qty > this.qty) {
                transferredQty = this.qty;
            }
            this.qty -= transferredQty;
            await this.update();
            let receivedQty = Math.floor(transferredQty * (this.pkgQty/toItem.pkgQty));
            toItem.qty += receivedQty;
            await toItem.update();
            await conn.commit();
            return Promise.resolve(`success: transferred ${transferredQty} of ${this.hrId()} --> ${receivedQty} of ${toItem.hrId()}`);
        } catch(err) {
            conn.rollback();
            return Promise.reject(err);
        } finally {
            conn.end();
        }
    }

    /*
     *  human readable Id
     */
    hrId() {
        return `[${this.name},${this.itemClass},${this.itemType}]`;
    }

    static async findByNameAndClassAndType(name, itemClass,itemType) {
        let result = await pool.query('select * from items where name = ? and itemClass = ? and itemType = ?', [name, itemClass, itemType] );
        if( result.length == 0 ) {
            return Promise.reject(new Error(`no item found for [${name},${itemClass},${itemType}]`))
        } else {
            return Promise.resolve(new Item(result[0]));
        }
    }

    static async getItemById(id) {
        let row = await pool.query('select * from items where id = ?', id);  // should be either 0 or 1 row
        if(row.length == 0) {
            return Promise.reject(new Error(`item with id=${id} not found`))
        } else {
            return Promise.resolve(new Item(row[0]));
        }
    }

    static async deleteItem(id) {
        let result = await pool.query('delete from items where id = ?', id);
        if( result.affectedRows == 1) {
            return Promise.resolve("success: 1 item deleted");
        } else {
            return Promise.reject(new Error(`error: failed to delete item with id ${id}`));
        }
    }

   static _parseEnumValues(enumValues) {
       let vals = enumValues[0].enumValues;
       let valArr = vals.match(/([a-zA-Z]+)/g)
       return valArr.slice(1);
   }

   static async getTypeValues() {
        let types = await pool.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemType';");
        return Promise.resolve(Item._parseEnumValues(types));
   }

   static async getClassValues() {
      let classes = await pool.query("select column_type as 'enumValues' from information_schema.columns where table_schema = 'warehouse' and table_name = 'items' and column_name = 'itemClass';")
      return Promise.resolve(Item._parseEnumValues(classes));
    }

   
}

export default Item;