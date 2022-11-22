const pool   = require('../db/db.js');
const setup = require('./setup.js');

const itemsReport = require('../lib/reports/itemsReport.js');
const needToOrder = require('../lib/reports/needToOrder.js');
const receivingReport = require('../lib/reports/receivingReport.js');
const shippingReport = require('../lib/reports/shippingReport.js');
const transferReport = require('../lib/reports/transferReport.js');

const reportFile = require('../lib/utils/reportFile.js')
const fs = require('fs');
const fsPromises = fs.promises;

let connectionsAcquired = 0;
let connectionsReleased = 0;


const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

beforeAll( async () => {
  pool.on('acquire', (_) => {
    connectionsAcquired += 1;
  })
  pool.on('release', (_) => {
    connectionsReleased += 1;
  })

  await setup({db: { deleteData: true, loadData: true}});
  
})

afterAll(() => {
    return pool.end();
});
 

test('item report has 14 rows', async () => {
    expect.assertions(1);
     let report = await itemsReport('all','');
      await expect(report.length).toBe(14);
  })

  test('itemReport.csv returns a file', async () => {
    expect.assertions(2);
      let rptFile = reportFile(`all_items`);
      let result = await itemsReport.csv("all", "", rptFile);
      await expect(result).toEqual({ok: true});
      let contents = await fsPromises.readFile(rptFile,'utf8');
      await expect(contents).toMatch(/Name/);
      await fsPromises.unlink(rptFile);
  })

  /*
   * shipping report tests
   */
test('30 day shipping summary report', async () => {
  expect.assertions(1);
    let report = await shippingReport(30,'all');
    await expect(report.length).toEqual(14);
})

test('60 day shipping summary report', async () => {
  expect.assertions(1);
    let report = await shippingReport(60,'all');
    await expect(report.length).toEqual(14);
})

test('90 day shipping summary report', async () => {
  expect.assertions(1);
    let report = await shippingReport(90,'all');
    await expect(report.length).toEqual(14);
})
 
test('120 day shipping summary report', async () => {
  expect.assertions(1);
    let report = await shippingReport(120,'all');
    await expect(report.length).toEqual(14);
})

test('30 day shipping details report', async () => {
  expect.assertions(1);
     let report = await shippingReport.details(30,"name",'all');
     await expect(report.length).toEqual(28);
})

test('60 day shipping details report', async () => {
  expect.assertions(1);
     let report = await shippingReport.details(60,"name",'all');
     await expect(report.length).toEqual(56);
})
 
test('90 day shipping details report', async () => {
  expect.assertions(1);
     let report = await shippingReport.details(90,"name",'all');
     await expect(report.length).toEqual(84);
})

test('120 day shipping details report', async () => {
  expect.assertions(1);
     let report = await shippingReport.details(120,"name",'all');
     await expect(report.length).toEqual(112);
})

test('shippingReport.csv returns a file', async () => {
  expect.assertions(2);
    let rptFile = reportFile(`shippping_summary_30_day_all_items`);
    let result = await shippingReport.csv(30, "all", rptFile);
    await expect(result).toEqual({ok: true});
    let contents = await fsPromises.readFile(rptFile,'utf8');
    await expect(contents).toMatch(/"Name","Class","Type","Shipped","On Hand","Last Ship"/);
    await fsPromises.unlink(rptFile);
})

// receiving report tests
test('30 day receiving summary report', async () => {
  expect.assertions(1);
    let report = await receivingReport(30,'all');
    await expect(report.length).toEqual(14);
})

test('60 day receiving summary report', async () => {
  expect.assertions(1);
    let report = await receivingReport(60,'all');
    await expect(report.length).toEqual(14);
})

test('90 day receiving summary report', async () => {
  expect.assertions(1);
    let report = await receivingReport(90,'all');
    await expect(report.length).toEqual(14);
})
 
test('120 day receiving summary report', async () => {
  expect.assertions(1);
    let report = await receivingReport(120,'all');
    await expect(report.length).toEqual(14);
})

test('30 day receiving details report', async () => {
  expect.assertions(1);
     let report = await receivingReport.details(30,"name",'all');
     await expect(report.length).toEqual(28);

})

test('60 day receiving details report', async () => {
  expect.assertions(1);
  let report = await receivingReport.details(60,"name",'all');
  await expect(report.length).toEqual(56);
})
 
test('90 day receiving details report', async () => {
  expect.assertions(1);
  let report = await receivingReport.details(90,"name",'all');
  await expect(report.length).toEqual(84);
})

test('120 day receiving details report', async () => {
  expect.assertions(1);
  let report = await receivingReport.details(120,"name",'all');
  await expect(report.length).toEqual(112);
})

test('receivingReport.csv returns a file', async () => {
  expect.assertions(2);
    let rptFile = reportFile(`receiving_summary_30_day_all_items`);
    let result = await receivingReport.csv(30, "all", rptFile);
    await expect(result).toEqual({ok: true});
    let contents = await fsPromises.readFile(rptFile,'utf8');
    await expect(contents).toMatch(/"Name","Class","Type","Received","On Hand","Last Received"/);
    await fsPromises.unlink(rptFile);
})

test('monthly shipping report', async() => {
  expect.assertions(13)
  let id = setup.items[0].id;
  let report = await itemsReport.itemShipments(id);
  await expect(report.length).toEqual(4);
  await expect(report[0].Year).toMatch(setup.dates[0].getFullYear().toString())
  await expect(report[0].Month).toMatch(months[setup.dates[0].getMonth()]);
  await expect(report[0].Shipments).toEqual("22");
  await expect(report[1].Year).toMatch(setup.dates[1].getFullYear().toString())
  await expect(report[1].Month).toMatch(months[setup.dates[1].getMonth()]);
  await expect(report[1].Shipments).toEqual("6");
  await expect(report[2].Year).toMatch(setup.dates[2].getFullYear().toString())
  await expect(report[2].Month).toMatch(months[setup.dates[2].getMonth()]);
  await expect(report[2].Shipments).toEqual("8");
  await expect(report[3].Year).toMatch(setup.dates[3].getFullYear().toString())
  await expect(report[3].Month).toMatch(months[setup.dates[3].getMonth()]);
  await expect(report[3].Shipments).toEqual("10");
})

test('need to order report', async () => {
  expect.assertions(6);
  let item = setup.items[0];
  let report = await needToOrder(2, "all");
  await expect(report.length).toEqual(1);
  await expect(report[0].Name).toEqual(item.name);
  await expect(report[0].Class).toEqual(item.itemClass);
  await expect(report[0].Type).toEqual(item.itemType)
  await expect(report[0].OnHand).toEqual(item.qty)
  await expect(Number(report[0].MonthlyUsage)).toEqual(14)
})

test('transfer report', async () => {
  let report = await transferReport(30, "all");
  await expect(report.length).toEqual(7);
  let detailReport = await transferReport.details(30, "name", "all");
  await expect(detailReport.length).toEqual(14);
})

test('transferReport.csv returns a file', async () => {
  expect.assertions(2);
    let rptFile = reportFile(`transfer_summary_`);
    let result = await transferReport.csv(30, "all", rptFile);
    await expect(result).toEqual({ok: true});
    let contents = await fsPromises.readFile(rptFile,'utf8');
    await expect(contents).toMatch(/"Name","Class","Type","Unit","Transferred","Package Qty","To","Last Transfer"/);
    await fsPromises.unlink(rptFile);
})

test('database connections are released', async() => {
    //console.log(`acquired connections ${connectionsAcquired} released connections ${connectionsReleased}`)
    await expect(connectionsReleased).toBe(connectionsAcquired);
});
