
import puppeteer from 'puppeteer'
import HomePageModel from './pom/HomePageModel.js'
import config from './config.json'
import setup from './setup.js'
import pool from '../db/db.js'

let browser;
let page;
let homePageModel;
let response;


beforeAll( async() => {
    await setup({db: {deleteData: true, loadData:true}});  // loads the database
    browser = await puppeteer.launch(config.launchOptions); 
})

beforeEach( async () => {
    page = await browser.newPage();
    await page.setViewport({width: 1024, height: 760})
    homePageModel = new HomePageModel(page, config);
    response = await homePageModel.go();
})

afterEach( async () => {
    await page.close();
})

afterAll( async () => {
    await browser.close();
    await pool.end();
})

test("test home page'", async () => {
    expect.assertions(10);
    
    await expect([200,304]).toContain(response.status());

    await expect(await homePageModel.title()).toMatch(config.pageTitle)
    let buttons = await homePageModel.navButtons();
    await expect(buttons.length).toEqual(7);
    
    await expect(await page.evaluate( element => element.textContent, buttons[0])).toEqual("Items")
    await expect(await page.evaluate( element => element.textContent, buttons[1])).toEqual("Categories")
    await expect(await page.evaluate( element => element.textContent, buttons[2])).toEqual("Units")
    await expect(await page.evaluate( element => element.textContent, buttons[3])).toEqual("Receiving Report")
    await expect(await page.evaluate( element => element.textContent, buttons[4])).toEqual("Shipping Report")
    await expect(await page.evaluate( element => element.textContent, buttons[5])).toEqual("Transfer Report")
    await expect(await page.evaluate( element => element.textContent, buttons[6])).toEqual("Need To Order")
})

test('Items button works', async () => {
    expect.assertions(9);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[0].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(15); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Name")
    await expect(await hr.$eval('th:nth-child(2)', node => node.innerText)).toEqual("Class")
    await expect(await hr.$eval('th:nth-child(3)', node => node.innerText)).toEqual("Type")
    await expect(await hr.$eval('th:nth-child(4)', node => node.innerText)).toEqual("Category")
    await expect(await hr.$eval('th:nth-child(5)', node => node.innerText)).toEqual("Unit")
    await expect(await hr.$eval('th:nth-child(6)', node => node.innerText)).toEqual("Pkg Qty")
    await expect(await hr.$eval('th:nth-child(7)', node => node.innerText)).toEqual("Units On Hand")
    await expect(await hr.$eval('th:nth-child(8)', node => node.innerText)).toEqual("Last Update")
    
})

test('Categories button works', async () => {
    expect.assertions(2);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[1].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(12); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Category")
    
})

test('Units button works', async () => {
    expect.assertions(2);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[2].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(11); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Unit")
    
})

test('Receiving Report button works', async () => {
    expect.assertions(7);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[3].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(15); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Name")
    await expect(await hr.$eval('th:nth-child(2)', node => node.innerText)).toEqual("Class")
    await expect(await hr.$eval('th:nth-child(3)', node => node.innerText)).toEqual("Type")
    await expect(await hr.$eval('th:nth-child(4)', node => node.innerText)).toEqual("Received")
    await expect(await hr.$eval('th:nth-child(5)', node => node.innerText)).toEqual("On Hand")
    await expect(await hr.$eval('th:nth-child(6)', node => node.innerText)).toEqual("Last Receive")
    
})

test('Shipping Report button works', async () => {
    expect.assertions(7);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[4].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(15); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Name")
    await expect(await hr.$eval('th:nth-child(2)', node => node.innerText)).toEqual("Class")
    await expect(await hr.$eval('th:nth-child(3)', node => node.innerText)).toEqual("Type")
    await expect(await hr.$eval('th:nth-child(4)', node => node.innerText)).toEqual("Shipped")
    await expect(await hr.$eval('th:nth-child(5)', node => node.innerText)).toEqual("On Hand")
    await expect(await hr.$eval('th:nth-child(6)', node => node.innerText)).toEqual("Last Ship")
    
})

test('Transfer Report button works', async () => {
    expect.assertions(9);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[5].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(8); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Name")
    await expect(await hr.$eval('th:nth-child(2)', node => node.innerText)).toEqual("Class")
    await expect(await hr.$eval('th:nth-child(3)', node => node.innerText)).toEqual("Type")
    await expect(await hr.$eval('th:nth-child(4)', node => node.innerText)).toEqual("Unit")
    await expect(await hr.$eval('th:nth-child(5)', node => node.innerText)).toEqual("Units Transferred")
    await expect(await hr.$eval('th:nth-child(6)', node => node.innerText)).toEqual("Qty per Unit")
    await expect(await hr.$eval('th:nth-child(7)', node => node.innerText)).toEqual("To Class")
    await expect(await hr.$eval('th:nth-child(8)', node => node.innerText)).toEqual("Last Transfer")
    
})

test('Need to Order button works', async () => {
    expect.assertions(6);
    let buttons = await homePageModel.navButtons();

    const itemNavigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await buttons[6].click();
    await itemNavigationPromise;

    let rows = await page.$$('tr');
    await expect(rows.length).toEqual(2); // first row is the header row
    let hr = rows[0];
    await expect(await hr.$eval('th:nth-child(1)', node => node.innerText)).toEqual("Name")
    await expect(await hr.$eval('th:nth-child(2)', node => node.innerText)).toEqual("Class")
    await expect(await hr.$eval('th:nth-child(3)', node => node.innerText)).toEqual("Type")
    await expect(await hr.$eval('th:nth-child(4)', node => node.innerText)).toEqual("On Hand")
    await expect(await hr.$eval('th:nth-child(5)', node => node.innerText)).toEqual("Monthly Usage")    
})

