const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')


   /*
    *  Get the sum of the receiving records for the last days grouped by item
    *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
    */
function transferReport( days, filterClass, resultHandler ) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', sum(t.qty) as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', DATE_FORMAT(max(t.transferredAt), "%M %d %Y %r") as 'Last Transfer' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) ${filter} group by t.itemId,t.toClass order by i.name,i.itemClass,i.itemType`;
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

  /*
 *  Get the sum of the transfer records for the last days grouped by item
 *  throws an error if the query failes to calls to this function should be wrapped in a try/catch block
 */
function transferReportDetails( days, sortField = "name", filterClass, resultHandler ) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
     let orderBy = `order by i.name,i.itemClass,i.itemType`;
     if( sortField != "name") {
         orderBy = `order by ${sortField}`;
     }
     let sql = `select i.name as 'Name', i.itemClass as 'Class', i.itemType as 'Type', u.unit as 'Unit', t.qty as 'Transferred', i.pkgQty as 'Package Qty', t.toClass as 'To', t.split as 'Split', DATE_FORMAT(t.transferredAt,"%M %d %Y %r") as 'Transferred At' from transfers t, items i, units u where t.itemId = i.id and u.id = i.unit and t.transferredAt > date_sub(current_date, interval ${days} day) ${filter} ${orderBy}`;
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

function transferReportCSV( days, filterClass, file, resultHandler ) {
    let result = {ok: false, nbrRows: 0}
    transferReport(days, filterClass, (err, report) => {
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

module.exports = transferReport;
module.exports.csv = transferReportCSV;
module.exports.details = transferReportDetails;
