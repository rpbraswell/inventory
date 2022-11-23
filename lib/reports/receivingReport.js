import pool from '../../db/db.js'
import { parse } from 'json2csv'
import fs from 'fs'
const fsPromises = fs.promises

async function receivingReport( days, filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(r.qty) as 'Received', i.qty as 'On Hand', DATE_FORMAT(max(r.receivedAt),"%M %d %Y %r") as 'Last Received' from receiving r, items i where r.itemId = i.id and r.receivedAt > date_sub(current_date, interval ${days} day) ${filter} group by r.itemId order by i.name,i.itemClass,i.itemType`;
    return pool.query(sql);
}

async function receivingReportCSV( days, filterClass, file) {
    let report = await receivingReport(days, filterClass);
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
async function receivingReportDetails( days = 30, sortField = "name", filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let orderBy = `order by i.name,i.itemClass,i.itemType`;
    if( sortField != "name") {
        orderBy = `order by ${sortField} desc`;
    }
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', r.qty as 'Received', DATE_FORMAT(r.receivedAt,"%M %d %Y %r") as 'Received At' from receiving r, items i where r.itemId = i.id and r.receivedAt > date_sub(current_date, interval ${days} day) ${filter} ${orderBy}`;
    return pool.query(sql);
}

receivingReport.csv = receivingReportCSV;
receivingReport.details = receivingReportDetails;

export default receivingReport;
