
const puppeteer = require('puppeteer');
const ItemPageModel = require('./pom/ItemPageModel.js');
const config = require('./config.json');
const setup = require('./setup.js');
const pool = require('../db/db.js');
const Item = require('../db/Item.js');


jest.setTimeout(30000);

let browser;
let page;
let itemPageModel;
let response;

function delay(ms) {
    return new Promise( (resolve) => setTimeout( () => resolve("timed out"), ms))
}

beforeAll( async() => {
    await setup({db: {deleteData: true, loadData:true}});  // loads the database
    browser = await puppeteer.launch(config.launchOptions); 
})

beforeEach( async () => {
    page = await browser.newPage();
    await page.setViewport({width: 1024, height: 760})
    itemPageModel = new ItemPageModel(page, config);
    response = await itemPageModel.go();
})

afterEach( async () => {
    await page.close();
})

afterAll( async () => {
    await browser.close();
    await pool.end();
})


// rows is an array of element handles
async function findRowWithName(name, rows) {
    let td;
    let value;
    for(let row of rows) {
        td = await row.$('td')
        if( !td ) {
            continue;
        }
        value = await page.evaluate(td => td.innerText, td)
        if( value === name ) {
            return row;
        }
    }
    return null;
}

test("test add item", async () => {
    
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let nbrRows = rows.length;

    let item = {
        name: 'mixed vegetables',
        itemClass: 'grocery',
        itemType: 'dry',
        category: 'vegetable',
        unit: 'can',
        pkgQty: 1,
        qty: 10
    }

    //await itemPageModel.addItem(item)
    const link = await page.$('a[href="/items/add"]')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        link.click()
    ])

    await expect(page.url()).toMatch(/items\/add/)

    // wait for the nagivation
    const form = await page.$('[data-test-id="itemForm')
    const nameField = await form.$("#name");
    const itemClass = await form.$("#itemClass");
    const itemType = await form.$("#itemType");
    const category = await form.$("#category");
    const unit = await form.$("#unit");
    const pkgQty = await form.$("#pkgQty");
    const qty = await form.$("#qty");
    const submit = await form.$("[type='submit']");

    await nameField.type(item.name)
    await itemClass.type(item.itemClass);
    await itemType.type(item.itemType)
    await category.type(item.category);
    await unit.type(item.unit);

    await pkgQty.click({ clickCount: 3});
    await pkgQty.type(item.pkgQty + "");

    await qty.click({clickCount: 3})
    await qty.type(item.qty + "");

    response = await Promise.all([
        submit.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')

    await expect(rows.length).toBe(nbrRows+1)

    let newRow = await findRowWithName(item.name, rows)
    await expect(newRow).toBeDefined();

    let newRowData = await newRow.$$('td')
    await expect(await page.evaluate(d => d.innerText, newRowData[0])).toEqual(item.name)
    await expect(await page.evaluate(d => d.innerText, newRowData[1])).toEqual(item.itemClass)
    await expect(await page.evaluate(d => d.innerText, newRowData[2])).toEqual(item.itemType)
    await expect(await page.evaluate(d => d.innerText, newRowData[3])).toEqual(item.category)
    await expect(await page.evaluate(d => d.innerText, newRowData[4])).toEqual(item.unit)
    await expect(await page.evaluate(d => d.innerText, newRowData[5])).toEqual(item.pkgQty+"")
    await expect(await page.evaluate(d => d.innerText, newRowData[6])).toEqual(item.qty+"")

    
})


test('cancel button works for add item', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let initialNbrRows = rows.length;

    let item = {
        name: 'mixed fruit',
        itemClass: 'grocery',
        itemType: 'dry',
        category: 'fruit',
        unit: 'can',
        pkgQty: 1,
        qty: 10
    }

    //await itemPageModel.addItem(item)
    const link = await page.$('a[href="/items/add"]')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        link.click()
    ])

    await expect(page.url()).toMatch(/items\/add/)

     // wait for the nagivation
     const form = await page.$('[data-test-id="itemForm')
     const nameField = await form.$("#name");
     const itemClass = await form.$("#itemClass");
     const itemType = await form.$("#itemType");
     const category = await form.$("#category");
     const unit = await form.$("#unit");
     const pkgQty = await form.$("#pkgQty");
     const qty = await form.$("#qty");
     const cancel = await form.$("[data-test-id='cancelAddItem']")
 
     await nameField.type(item.name)
     await itemClass.type(item.itemClass);
     await itemType.type(item.itemType)
     await category.type(item.category);
     await unit.type(item.unit);
 
     await pkgQty.click({ clickCount: 3});
     await pkgQty.type(item.pkgQty + "");
 
     await qty.click({clickCount: 3})
     await qty.type(item.qty + "");

     response = await Promise.all([
        cancel.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')

    await expect(rows.length).toBe(initialNbrRows)

    let newRow = await findRowWithName(item.name, rows)
    await expect(newRow).toBeNull();
})

test('can update apple sauce to add 5 units', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let updateLink = await appleSauce.$('td:nth-child(9)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        updateLink.click()
    ])

    await expect(await page.$eval('.form-div h2', node => node.innerText)).toEqual("Update grocery dry apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("15")

    let submit = await page.$("form [type='submit']")

    response = await Promise.all([
        submit.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("15")
})

test('can cancel update apple sauce', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let updateLink = await appleSauce.$('td:nth-child(9)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        updateLink.click()
    ])

    await expect(await page.$eval('.form-div h2', node => node.innerText)).toEqual("Update grocery dry apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("20")

    let cancel = await page.$("form button[type='button']")

    response = await Promise.all([
        cancel.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("15")
})

test('can receive apple sauce to add 5 units', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let receiveLink = await appleSauce.$('td:nth-child(11)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        receiveLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="receiveItemName"', node => node.innerText)).toEqual("dry grocery apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let submit = await page.$("form [type='submit']")

    response = await Promise.all([
        submit.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("20")
})

test('can cancel receive apple sauce', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let receiveLink = await appleSauce.$('td:nth-child(11)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        receiveLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="receiveItemName"', node => node.innerText)).toEqual("dry grocery apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let cancel = await page.$("form button[type='button']")

    response = await Promise.all([
        cancel.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("20")
})

test('can ship apple sauce to reduce by 5 units', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let shipLink = await appleSauce.$('td:nth-child(12)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        shipLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="shipItemName"', node => node.innerText)).toEqual("dry grocery apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let submit = await page.$("form [type='submit']")

    response = await Promise.all([
        submit.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("15")
})

test('can cancel ship apple sauce', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let shipLink = await appleSauce.$('td:nth-child(12)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        shipLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="shipItemName"', node => node.innerText)).toEqual("dry grocery apple sauce")

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let cancel = await page.$("form button[type='button']")

    response = await Promise.all([
        cancel.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("15")
})

test('can transfer apple sauce from grocery to seniors', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let transferLink = await appleSauce.$('td:nth-child(13)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        transferLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="transferItemName"', node => node.innerText)).toEqual("From: dry grocery apple sauce")

    let toClass = await page.$('form #toClass')
    await toClass.type('seniors')

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let submit = await page.$("form [type='submit']")

    response = await Promise.all([
        submit.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    let appleSauceSeniors = rows[2];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("10")
    await expect(await appleSauceSeniors.$eval('td:nth-child(7)', node => node.innerText)).toEqual("40")
})

test('can cancel transfer apple sauce from grocery to seniors', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let transferLink = await appleSauce.$('td:nth-child(13)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        transferLink.click()
    ])

    await expect(await page.$eval('.form-div [data-test-id="transferItemName"', node => node.innerText)).toEqual("From: dry grocery apple sauce")

    let toClass = await page.$('form #toClass')
    await toClass.type('seniors')

    let qty = await page.$('form #qty')
    await qty.click({clickCount: 3})
    await qty.type("5")

    let cancel = await page.$("form button[type='button']")

    response = await Promise.all([
        cancel.click(),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    ])

    await expect(page.url()).toMatch(/reports\/items/)

    rows = await page.$$('tr')
    appleSauce = rows[1];
    let appleSauceSeniors = rows[2];
    
    await expect(await appleSauce.$eval('td:nth-child(7)', node => node.innerText)).toEqual("10")
    await expect(await appleSauceSeniors.$eval('td:nth-child(7)', node => node.innerText)).toEqual("40")
})

test('can get shipments for apple sauce', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let appleSauce = rows[1];
    let shipmentLink = await appleSauce.$('td:nth-child(14)')

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        shipmentLink.click()
    ])

    let heading = await page.$('.report-heading')

    await expect(await heading.$eval('span', node => node.innerText)).toMatch(/Monthly Shipping Report For: apple sauce grocery dry/)

    let lines = await page.$$('tr')

    await expect(lines.length).toEqual(5)

    let mostRecentMonth = lines[1];

    await expect(await mostRecentMonth.$eval('td:nth-child(3)', node => node.innerText)).toEqual("9")

})

test('can delete mixed vegetables', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let mixedVegetables = await findRowWithName("mixed vegetables", rows)

    let deleteLink = await mixedVegetables.$('td:nth-child(10)')

    console.log('before clicking the deleteLink')

    page.on('dialog', async dialog => {
        await expect(dialog.message()).toEqual("Are you sure you want to permanently delete item mixed vegetables/grocery/dry and associated shipping and receiving records from the database?")
        await dialog.accept();
    })

    let [reqponse] = await Promise.all([
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        deleteLink.click()
    ])
    

    rows = await page.$$('tr')

    mixedVegetables = await findRowWithName("mixed vegetables", rows)

    await expect(mixedVegetables).toBeNull()

})

test('can cancel delete', async () => {
    await expect([200,304]).toContain(response.status());
    await expect(await itemPageModel.title()).toMatch(config.pageTitle)
    await expect(response.request().url()).toMatch(/reports\/items/)

    let rows = await page.$$('tr');
    let nbrRows = rows.length;

    let appleSauce = rows[1];

    let deleteLink = await appleSauce.$('td:nth-child(10)')


    page.on('dialog', async dialog => {
        await expect(dialog.message()).toEqual("Are you sure you want to permanently delete item apple sauce/grocery/dry and associated shipping and receiving records from the database?")
        await dialog.dismiss();
    })

    
    await deleteLink.click()

    rows = await page.$$('tr')

    await expect(rows.length).toEqual(nbrRows)

    appleSause = await findRowWithName("apple sauce", rows)

    await expect(appleSauce).not.toBeNull()

    await expect(await appleSauce.$eval('td:nth-child(2)', node => node.innerText)).toMatch("grocery")

})
