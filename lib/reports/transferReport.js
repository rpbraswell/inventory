const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')
const fsPromises = fs.promises;


/*
 *  Get the sum of the receiving records for the last days grouped by item
 *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
 */
async function transferReport( days, filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', sum(t.qty) as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', DATE_FORMAT(max(t.transferredAt), "%M %d %Y %r") as 'Last Transfer' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) ${filter} group by t.itemId,t.toClass order by i.name,i.itemClass,i.itemType`;
    return pool.query(sql);
 }

  /*
 *  Get the sum of the transfer records for the last days grouped by item
 *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
 */
async function transferReportDetails( days, sortField = "name", filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
     let orderBy = `order by i.name,i.itemClass,i.itemType`;
     if( sortField != "name") {
         orderBy = `order by ${sortField} desc`;
     }
     let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', t.qty as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', t.split as 'Split', DATE_FORMAT(t.transferredAt,"%M %d %Y %r") as 'Transferred At' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) ${filter} ${orderBy}`;
     return pool.query(sql);
 }

async function transferReportCSV( days, filterClass, file) {
    let report = await transferReport(days, filterClass);
    if( report.length > 0 ) {
        // convert to csv
        const csv = parse(report)
        await fsPromises.writeFile(file, csv);
        return Promise.resolve({ok: true})
    } else {
        return Promise.resolve({ok: false});
    }
 }

module.exports = transferReport;
module.exports.csv = transferReportCSV;
module.exports.details = transferReportDetails;
