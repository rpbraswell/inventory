const Item   = require('../db/Item.js');
const Category = require('../db/Category.js');
const Unit     = require('../db/Unit.js');
const Shipping = require('../db/Shipping.js');
const Receiving = require('../db/Receiving.js');
const Transfer = require('../db/Transfer.js');
const pool   = require('../db/db.js');

const itemsReport = require('../lib/reports/itemsReport.js');
const reportFile = require('../lib/utils/reportFile.js')
const fs = require('fs');
const { shipItem } = require('../db/Shipping.js');
const { assert } = require('console');
const setup = require('./setup.js');
const fsPromises = fs.promises;

let connectionsAcquired = 0;
let connectionsReleased = 0;

let item1;

beforeAll( async () => {
  pool.on('acquire', (_) => {
    connectionsAcquired += 1;
  })
  pool.on('release', (_) => {
    connectionsReleased += 1;
  })
  await setup({db: { deleteData: true, loadData: false}})
})

afterAll(() => {
   return pool.end();
});

/*
 *  Item class method tests
 */
test('Item.getClassValues()', async () => {
  let data;
  expect.assertions(5);
  try {
        data = await Item.getClassValues();
        await expect(data).toContain("grocery");
        await expect(data).toContain("USDA");
        await expect(data).toContain("seniors");
        await expect(data).toContain("schools");
        await expect(data).toContain("thanksgiving");
   } catch(err) {
      console.log(err);
  }
})

test('Item.getTypeValues()', async () => {
  let data;
  expect.assertions(3);
  try {
        data = await Item.getTypeValues();
        await expect(data).toContain('dry');
        await expect(data).toContain('frozen');
        await expect(data).toContain('refrigerated');
  } catch(err) {
      console.log(err);
  }
})

/*
   * item promises tests
   */
test('Item.getItemById()', async () => {
  expect.assertions(6);
  let item = new Item( {
    name: "crnaberries",
    itemClass: "grocery",
    itemType: "dry",
    category: setup.getIdForCategory("fruit"),
    unit: setup.getIdForUnit("can"),
    pkgQty: 1,
    qty: 10
  })

  await expect(item.insert()).resolves.toMatch("success: 1 item inserted");
  await expect(item.id).toBeDefined();
  await expect(item.id).toBeGreaterThan(0);  // id is highest one yet
  let insertedItem = await Item.getItemById(item.id);
  await expect(item.hrId()).toEqual(insertedItem.hrId());
  try {
     let bogusItem = await Item.getItemById(item.id + 1n);  // should throw an expection
  } catch(err) {
      await expect(err).toBeInstanceOf(Error);
      await expect(err.message).toMatch(/^item with id=.*not found$/)
  }
})

test("Item.findByNameAndClassAndType()", async () => {
  expect.assertions(10);
  let item = new Item( {
    name: "pinto beans",
    itemClass: "schools",
    itemType: "dry",
    category: setup.getIdForCategory("beans"),
    unit: setup.getIdForUnit("can"),
    pkgQty: 1,
    qty: 11
  })
  await expect(item.insert()).resolves.toMatch("success: 1 item inserted");
  await expect(Item.findByNameAndClassAndType(item.name, item.itemClass, item.itemType)).resolves.toBeInstanceOf(Item);
  let insertedItem = await Item.findByNameAndClassAndType(item.name, item.itemClass, item.itemType);
  await expect(insertedItem.name).toEqual("pinto beans");
  await expect(insertedItem.itemClass).toEqual("schools");
  await expect(insertedItem.itemType).toEqual("dry");
  await expect(insertedItem.category).toEqual(setup.getIdForCategory("beans"));
  await expect(insertedItem.unit).toEqual(setup.getIdForUnit("can"));
  await expect(insertedItem.pkgQty).toEqual(1);
  await expect(insertedItem.qty).toEqual(11);
  await expect(Item.findByNameAndClassAndType("bogus", item.itemClass, item.itemType)).rejects.toBeInstanceOf(Error);

})

test('Item.deleteItem()', (done) => {
  expect.assertions(2);
  let item = new Item( {
    name: "black beans",
    itemClass: "schools",
    itemType: "dry",
    category: setup.getIdForCategory("beans"),
    unit: setup.getIdForUnit("can"),
    pkgQty: 1,
    qty: 10
  })
  item.insert()
  .then( (_) => {
      console.log(_);
      Item.deleteItem(item.id + 1n)
      .then( (result) => {
          console.log(result);
          done();
      })
      .catch( (err) => {
        expect(err).toBeInstanceOf(Error);
      })
      Item.deleteItem(item.id)
      .then( (result) => {
        expect(result).toMatch("success: 1 item deleted")
        done();
      })
      .catch( (err) => {
        done(err);
      })
  })
  .catch( (err) => {
    console.log(err);
  })

})

/*
 * Instance method tests
 */

test('Item.isValid()', async () => {
    expect.assertions(15);
    let item = new Item( {
      name: "peaches",
      itemClass: "grocery",
      itemType: "dry",
      category: setup.getIdForCategory("fruit"),
      unit: setup.getIdForUnit("can"),
      pkgQty: 1,
      qty: 10
    })
    await expect(item.isValid("insert")).resolves.toEqual({ok: true});
    try {
        await item.isValid("update");
    } catch(err) {
        await expect(err).toBeInstanceOf(Error);
        await expect(err.messages.length).toEqual(1);
        await expect(err.messages[0]).toEqual("update requires a valid id");
    }
    item.id = 5n;
    await expect(item.isValid("update")).resolves.toEqual({ok: true});
    try {
        await item.isValid("insert")
    } catch(err) {
        await expect(err.messages[0]).toMatch("cannot insert an item with an id")
    }

    delete item.name;
    delete item.category;
    delete item.unit;
    delete item.itemClass;
    delete item.itemType;
    item.qty = -1;
    delete item.pkgQty;
    try {
      await item.isValid("update")
    } catch(err) {
        await expect(err.messages).toContain("name must be a string of at least 2 characters")
        await expect(err.messages).toContain("you must select a valid caetegory")
        await expect(err.messages).toContain("you must select a valid unit")
        await expect(err.messages).toContain("you must select a valid item class")
        await expect(err.messages).toContain("you must select a valid item type")
        await expect(err.messages).toContain("you cannot have a negative qty on hand")
        await expect(err.messages).toContain("you must select a valid caetegory")
        await expect(err.messages).toContain("pkgQty must be a number greater than 0")
        await expect(err.message).toMatch("item validation for update failed")
    }
})

test('Item.insert()', async () => {
      expect.assertions(14);
      let item = new Item( {
        name: "peaches",
        itemClass: "grocery",
        itemType: "dry",
        category: setup.getIdForCategory("fruit"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })
      await expect(item.insert()).resolves.toMatch('success: 1 item inserted');
      await expect(item.id).toBeGreaterThan(0);
      await expect(item.lastUpdate).not.toBeDefined();
      let insertedItem = await Item.getItemById(item.id);
      await expect(insertedItem.id).toEqual(Number(item.id));
      await expect(insertedItem.name).toEqual("peaches");
      await expect(insertedItem.itemClass).toEqual("grocery");
      await expect(insertedItem.itemType).toEqual("dry");
      await expect(insertedItem.category).toEqual(setup.getIdForCategory("fruit"));
      await expect(insertedItem.unit).toEqual(setup.getIdForUnit("can"));
      await expect(insertedItem.pkgQty).toEqual(1);
      await expect(insertedItem.qty).toEqual(10);
      await expect(insertedItem.lastUpdate).toBeDefined();
      await expect(insertedItem.lastUpdate).toBeInstanceOf(Date);
      try {
          await item.insert();
      } catch(err) {
          await expect(err.messages).toContain("cannot insert an item with an id");
      }
  })

  test('Item.update()', async () => {
    expect.assertions(7);
    let item = new Item( {
      name: "apples",
      itemClass: "grocery",
      itemType: "dry",
      category: setup.getIdForCategory("fruit"),
      unit: setup.getIdForUnit("can"),
      pkgQty: 1,
      qty: 10
    })
    // update with null id
    try {
        await item.update();

    } catch(err) {
        await expect(err.messages).toContain("update requires a valid id");
    }
    await expect(item.insert()).resolves.toMatch('success: 1 item inserted');
    let insertedItem = new Item((await pool.query("select * from items where id = ?",item.id))[0]);
    // simuolate some delay so dates will be different
    let timeoutPromise = new Promise((res) => setTimeout(() => res("timed out after 1.1 seconds"), 1100));
    await expect(timeoutPromise).resolves.toMatch("timed out after 1.1 seconds");
    // update to set new qty
    item.qty += 10;
    await expect(item.update()).resolves.toMatch('success: 1 item updated');
    let updatedItem = new Item((await pool.query("select * from items where id = ?",item.id))[0]);
    await expect(updatedItem.qty).toEqual(20);
    await expect(updatedItem.lastUpdate.getTime()).toBeGreaterThan(insertedItem.lastUpdate.getTime());
    
    // update with invalid id
    try {
      item.id += 1n;
        await item.update();
    } catch(err) {
        await expect(err.message).toMatch(`error: failed to update item with id ${item.id}`)
    }

  })

  test('Item.delete()', async () => {
      expect.assertions(5);
      let item = new Item( {
        name: "oranges",
        itemClass: "grocery",
        itemType: "dry",
        category: setup.getIdForCategory("fruit"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })
      try {
        await item.delete();
      } catch(err) {
        await expect(err.message).toMatch(/error: cannot delete an item without an id/);
      }
      await expect(item.insert()).resolves.toMatch('success: 1 item inserted');
      let invalidId = item.id + 1n;
      await expect(item.delete()).resolves.toMatch('success: 1 item deleted');
      await expect(item.id).not.toBeDefined();
      item.id = invalidId;
      try {
        await item.delete();
      } catch(err) {
        await expect(err.message).toMatch(`error: failed to delete item with id ${item.id}`)
      }
  })

  test('Item.ship()', async () => {
      expect.assertions(9);
      let item = new Item( {
        name: "oranges",
        itemClass: "grocery",
        itemType: "dry",
        category: setup.getIdForCategory("fruit"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })

      let shippingCount = (await pool.query('select count(*) as count from shipping'))[0].count;
      await expect(item.insert()).resolves.toMatch('success: 1 item inserted');
      await expect(item.id).toBeDefined();
      await expect(item.ship(5)).resolves.toMatch('success: shipped 5');
      await expect(item.qty).toEqual(5);
      let shippedItem = new Item((await pool.query("select * from items where id = ?",item.id))[0]);
      await expect(shippedItem.qty).toEqual(5);
      let shippingRecord = new Shipping((await pool.query("select * from shipping where itemId = ?", item.id))[0]);
      await expect(shippingRecord.qty).toEqual(5);
      let newShippingCount = (await pool.query('select count(*) as count from shipping'))[0].count;
      await expect(newShippingCount).toEqual(shippingCount + 1n);

      item.id += 1n;  // invalid
      try {
          await item.ship(1);  // export an error to be thrown
      } catch (err) {
          await expect(err).toBeInstanceOf(Error);
          await expect(err.code).toMatch('ER_NO_REFERENCED_ROW_2');
      }

  })

  test('Item.receive()', async () => {
    expect.assertions(9);
    let item = new Item( {
      name: "mixed fruit",
      itemClass: "grocery",
      itemType: "dry",
      category: setup.getIdForCategory("fruit"),
      unit: setup.getIdForUnit("can"),
      pkgQty: 1,
      qty: 10
    })

    let receivingCount = (await pool.query('select count(*) as count from receiving'))[0].count;
    await expect(item.insert()).resolves.toMatch('success: 1 item inserted');
    await expect(item.id).toBeDefined();
    await expect(item.receive(5)).resolves.toMatch('success: received 5');
    await expect(item.qty).toEqual(15);
    let receivedItem = new Item((await pool.query("select * from items where id = ?",item.id))[0]);
    await expect(receivedItem.qty).toEqual(15);
    let receivingRecord = new Receiving((await pool.query("select * from receiving where itemId = ?", item.id))[0]);
    await expect(receivingRecord.qty).toEqual(5);
    let newReceivingCount = (await pool.query('select count(*) as count from receiving'))[0].count;
    await expect(newReceivingCount).toEqual(receivingCount + 1n);

    item.id += 1n;  // invalid
    try {
        await item.receive(1);  // export an error to be thrown
    } catch (err) {
        await expect(err).toBeInstanceOf(Error);
        await expect(err.code).toMatch('ER_NO_REFERENCED_ROW_2');
    }

  })

  /*
   * transfer test
   */
  test('Item.transfer()', async() => {
      expect.assertions(10);
      let fromItem = new Item( {
        name: "apple sauce",
        itemClass: "grocery",
        itemType: "dry",
        category: setup.getIdForCategory("fruit"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 6,
        qty: 10
      })
      let toItem = new Item( {
        name: "apple sauce",
        itemClass: "seniors",
        itemType: "dry",
        category: setup.getIdForCategory("fruit"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })
      try {
        await fromItem.transfer(toItem,1);
      } catch(err) {
        await expect(err.message).toMatch('error: cannot transfer an item without an id')
      }

      await fromItem.insert();
      try {
        await fromItem.transfer(toItem,1);
      } catch(err) {
        await expect(err.message).toMatch('error: cannot transfer to an item with no id')
      }
      await toItem.insert();
      await expect(fromItem.transfer(toItem,1)).resolves.toMatch(`success: transferred 1 of ${fromItem.hrId()} --> 6 of ${toItem.hrId()}`)
      let insertedFromItem = await Item.getItemById(fromItem.id);
      let insertedToItem = await Item.getItemById(toItem.id);
      await expect(insertedFromItem.qty).toEqual(9);
      await expect(insertedToItem.qty).toEqual(16);
      let transfer = new Transfer((await pool.query("select * from transfers where itemId = ?",fromItem.id))[0]);
      await expect(transfer.qty).toEqual(1);
      await expect(transfer.split).toBe(true);

      let fromItem2 = new Item( {
        name: "black beans",
        itemClass: "grocery",
        itemType: "dry",
        category: setup.getIdForCategory("beans"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })
      let toItem2 = new Item( {
        name: "black beans",
        itemClass: "seniors",
        itemType: "dry",
        category: setup.getIdForCategory("beans"),
        unit: setup.getIdForUnit("can"),
        pkgQty: 1,
        qty: 10
      })

      await fromItem2.insert();
      await toItem2.insert();
      await expect(fromItem2.transfer(toItem2,1)).resolves.toMatch(`success: transferred 1 of ${fromItem2.hrId()} --> 1 of ${toItem2.hrId()}`)
      let transfer2 = new Transfer((await pool.query("select * from transfers where itemId = ?",fromItem2.id))[0]);
      await expect(transfer2.qty).toEqual(1);
      await expect(transfer2.split).toBe(false);

  })

  
  test('database connections are released', async() => {
    await expect(connectionsReleased).toBe(connectionsAcquired);
  })
