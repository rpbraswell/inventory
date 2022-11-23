import pool from '../../db/db.js'
import { parse } from 'json2csv'
import fs from 'fs'
const fsPromises = fs.promises;

async function shippingReport( days = 30, filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(s.qty) as 'Shipped', i.qty as 'On Hand', DATE_FORMAT(max(s.shippedAt),"%M %d %Y %r") as 'Last Ship' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) ${filter} group by s.itemId order by i.name,i.itemClass,i.itemType`;
    return pool.query(sql);
}

async function shippingReportCSV( days, filterClass, file) {
    let report = await shippingReport(days, filterClass);
    if( report.length > 0 ) {
        // convert to csv
        const csv = parse(report)
        await fsPromises.writeFile(file, csv);
        return Promise.resolve({ok: true})
    } else {
        return Promise.resolve({ok: false});
    }
}

/*
 *  Get the sum of the receiving records for the last days grouped by item
 *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
 */
async function shippingReportDetails( days, sortField = "name", filterClass ) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let orderBy = `order by i.name,i.itemClass,i.itemType`;
    if( sortField != "name") {
        orderBy = `order by ${sortField} desc`;
    }
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', s.qty as 'Shipped', DATE_FORMAT(s.shippedAt,"%M %d %Y %r") as 'Shipped At' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) ${filter} ${orderBy}`;
    return pool.query(sql);
}

shippingReport.csv = shippingReportCSV;
shippingReport.details = shippingReportDetails;

export default shippingReport;
