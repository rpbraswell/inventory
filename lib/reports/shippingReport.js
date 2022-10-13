const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')

function shippingReport( days = 30, resultHandler ) {
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', sum(s.qty) as 'Shipped', i.qty as 'On Hand', DATE_FORMAT(max(s.shippedAt),"%M %d %Y %r") as 'Last Ship' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) group by s.itemId order by i.name,i.itemClass,i.itemType`;
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

function shippingReportCSV( days = 30, file, resultHandler) {
    let result = {ok: false, nbrRows: 0}
    shippingReport(days, (err, report) => {
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
function shippingReportDetails( days = 30, sortField = "name", resultHandler ) {
    let orderBy = `order by i.name,i.itemClass,i.itemType`;
    if( sortField != "name") {
        orderBy = `order by ${sortField}`;
    }
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', s.qty as 'Shipped', DATE_FORMAT(s.shippedAt,"%M %d %Y %r") as 'Shipped At' from shipping s, items i where s.itemId = i.id and s.shippedAt > date_sub(current_date, interval ${days} day) ${orderBy}`;
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

module.exports = shippingReport;
module.exports.csv = shippingReportCSV;
module.exports.details = shippingReportDetails;
