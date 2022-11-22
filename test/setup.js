const pool = require ('../db/db.js');
const Item   = require('../db/Item.js');
const Category = require('../db/Category.js');
const Unit     = require('../db/Unit.js');
const fs = require('fs');
const fsPromises = fs.promises;
/*
const Shipping = require('../db/Shipping.js');
const Receiving = require('../db/Receiving.js');
const Transfer = require('../db/Transfer.js');
*/

let categories;
let units;
let itemTypeValues;
let itemClassValues;
let items = [];  // items loaded if data loaded
let dates = [];

function getIdForUnit( unit ) {
    for(let u of units) {
      if(u[1] == unit) {
        return u[0];
      }
    }
    return 0;
}
  
function getIdForCategory( category ) {
    for(let c of categories) {
      if(c[1] == category) {
        return c[0];
      }
    }
    return 0;
}
  
function getDates(n) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();
  
    for(let i = 0; i < n; i++) {
       let dte = new Date(year,month,day);
       dates.push(dte);
       if( --month < 0 ) {
          month = 11;
          year--;
       }
    }
    module.exports.dates = dates;
    return dates;
}

async function loadData() {
    let jsonItems = await fsPromises.readFile('./test/data/items.json','utf8');
    let _items = JSON.parse(jsonItems);
    // replace the name of the category and unit with the foreign key 
    // row data [name,itemClass,itemType,category,unit,pkgQty,qty]
    // console.log(items);
    for(let _item of _items) {
        _item[3] = getIdForCategory(_item[3]);
        _item[4] = getIdForUnit(_item[4]);
    }
    await pool.batch('insert into items (name,itemClass,itemType,category,unit,pkgQty,qty) values (?,?,?,?,?,?,?)',_items);
    let result = await pool.query({rowsAsArray: false, sql: 'select * from items'});
    items = result.map( (i) => { return new Item(i) } );
    module.exports.items = items;
    let dates = getDates(4);
    for(let item of items) {
        await pool.batch('insert into shipping (itemId,qty, shippedAt) values (?,?,?)', [
             [item.id, item.name == "carrots" && item.itemClass == "grocery" ? 20 : 2, dates[0]],
             [item.id, 2, dates[0]],
             [item.id, 3, dates[1]],
             [item.id, 3, dates[1]],
             [item.id, 4, dates[2]],
             [item.id, 4, dates[2]],
             [item.id, 5, dates[3]],
             [item.id, 5, dates[3]]
  
          ]
        )
        await pool.batch('insert into receiving (itemId,qty, receivedAt) values (?,?,?)', [
            [item.id, 1, dates[0]],
            [item.id, 2, dates[1]],
            [item.id, 3, dates[2]],
            [item.id, 4, dates[3]],
            [item.id, 1, dates[0]],
            [item.id, 2, dates[1]],
            [item.id, 3, dates[2]],
            [item.id, 4, dates[3]]
          ])

        if ( item.itemClass == "grocery") {
            await pool.batch('insert into transfers (itemId, toClass, qty, split, transferredAt) values (?,?,?,?,?)', [
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[0]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[1]],
                [item.id, "seniors", 1, item.pgkQty > 1 ? 1 : 0, dates[2]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[3]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[0]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[1]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[2]],
                [item.id, "seniors", 1, item.pkgQty > 1 ? 1 : 0, dates[3]]
            ])
        }
    }
}

async function initializeDatabase(options) {
    try {
        if( options.deleteData ) {
            await pool.query("delete from items where id > 0");
        }
        if( options.loadData ) {
            await loadData();
        }
      } catch (err) {
        console.log('error getting data for inserting items',err);
      }
}

async function setup(options) {
    let categoriesPromise = Category.getCategories();
    let unitsPromise = Unit.getUnits();
    let classValuesPromise = Item.getClassValues();
    let typeValuesPromise = Item.getTypeValues();
    let [_categories, _units, _classValues, _typeValues] = await Promise.all([categoriesPromise, unitsPromise, classValuesPromise, typeValuesPromise]);
    categories = _categories;
    units = _units;
    itemClassValues = _classValues;
    itemTypeValues = _typeValues;
    module.exports.categories = categories;
    module.exports.units = units;
    module.exports.itemClassValues = itemClassValues;
    module.exports.itemTypeValues = itemTypeValues;
    await initializeDatabase(options.db);
}


module.exports = setup;
module.exports.getIdForCategory = getIdForCategory;
module.exports.getIdForUnit = getIdForUnit;