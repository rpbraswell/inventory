const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')

function itemsReport(filterClass, _search, resultHandler ) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let search = _search == '' ? '' : `and i.name regexp '${_search}'`;
    pool.getConnection()
    .then( conn => {
          let sql = `select i.id as Id,i.name as Name,i.itemClass as ItemClass,i.itemType as ItemType,c.category as Category,u.unit as Unit,i.pkgQty as PackageQty,i.qty as OnHand,DATE_FORMAT(i.lastUpdate,"%M %d %Y %r") as LastUpdate from items i, categories c, units u where i.category=c.id and i.unit=u.id ${filter} ${search} order by i.name,i.itemClass,i.itemType`;
          conn.query( {rowsAsArray: false,  sql: sql } )
          .then( rows => {
               resultHandler(undefined, rows);
          })
          .catch( (err) => {
               resultHandler(err, undefined);
          })
          .finally( () => {
             conn.end();
          });
    })
    .catch( (err) => {
         resultHandler(err, undefined);
    });
 }

 function itemNames( resultHandler ) {
    let itemNames = [];
    itemsReport( (err, items) => {
        if( err ) {
            resultHandler(err, undefined);
        } else {
            items.forEach( (item) => {
                itemNames.push(`${item.name}:${item.itemClass}:${item.itemType}`);
            });
            resultHandler(undefined, itemNames);
        }
    })
}

function itemsReportCSV(filterClass, _search, file, resultHandler ) {
    let result = {ok: false, nbrRows: 0}
    itemsReport(filterClass, _search, (err, report) => {
        if( err ) {
            resultHandler(err, result)
        } else {
            result.nbrRows = report.length;
            if( report.length > 0 ) {
                // delete the Id property since it is not useful for the csv report
                for(let item of report) {
                    delete item.Id;
                }
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

function itemShipments( id, resultHandler ) {
    let sql = "select DATE_FORMAT(shippedAt,'%Y') as 'Year', monthname(shippedAt) as 'Month', sum(qty) as 'Shippments' from shipping where itemId=? group by DATE_FORMAT(shippedAt,'%Y'), monthname(shippedAt) order by DATE_FORMAT(shippedAt,'%Y'), month(shippedAt) DESC";
    pool.getConnection()
    .then( conn => {
        conn.query(sql,[id])
        .then( (res) => {
            resultHandler(undefined, res);
        })
        .catch( (err) => {
            resultHandler(err, undefined);
        })
        .finally( () => {
            conn.end();
        })
    })
}

module.exports = itemsReport;
module.exports.csv = itemsReportCSV;
module.exports.names = itemNames;
module.exports.itemShipments = itemShipments;
