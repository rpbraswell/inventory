const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')

function receivingReport( days = 30, resultHandler ) {
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(r.qty) as 'Received', i.qty as 'On Hand', DATE_FORMAT(max(r.receivedAt),"%M %d %Y %r") as 'Last Received' from receiving r, items i where r.itemId = i.id and r.receivedAt > date_sub(current_date, interval ${days} day) group by r.itemId order by i.name,i.itemClass,i.itemType`;
    pool.getConnection()
    .then( conn => { 
        conn.query(sql)
        .then( (report) => {
            resultHandler(undefined, report);
        })
        .catch( (err) => {
            resultHandler(err, undefined);
        })
        .finally( () => {
            conn.end();
        })
    })
   .catch( (err) => {
     resultHandler(err, undefined);
   });
}

function receivingReportCSV( days = 30, file, resultHandler) {
    let result = {ok: false, nbrRows: 0}
    receivingReport(days, (err, report) => {
        if( err ) {
            resultHandler(err, result)
        } else {
            result.nbrRows = report.length;
            if( report.length > 0 ) {
                // convert to csv
                const csv = parse(report)
                fs.writeFile(file, csv, (err) => {
                    if(err) {
                        resultHandler(err, result)
                    } else {
                        result.ok = true;
                        resultHandler(undefined, result)
                    }
                })
            } else {
                result.ok = true;
                resultHandler(undefined, result)
            }
        }
    })
}

/*
 *  Get the sum of the receiving records for the last days grouped by item
 *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
 */
function receivingReportDetails( days = 30, sortField = "name", resultHandler ) {
    let orderBy = `order by i.name,i.itemClass,i.itemType`;
    if( sortField != "name") {
        orderBy = `order by ${sortField}`;
    }
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', r.qty as 'Received', DATE_FORMAT(r.receivedAt,"%M %d %Y %r") as 'Received At' from receiving r, items i where r.itemId = i.id and r.receivedAt > date_sub(current_date, interval ${days} day) ${orderBy}`;
    pool.getConnection()
    .then( conn => { 
        conn.query(sql)
        .then( (report) => {
            resultHandler(undefined, report);
        })
        .catch( (err) => {
            resultHandler(err, undefined);
        })
        .finally( () => {
            conn.end();
        })
    })
    .catch( (err) => {
        resultHandler(err, undefined);
    });
}

module.exports = receivingReport;
module.exports.csv = receivingReportCSV;
module.exports.details = receivingReportDetails;
