const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')

function needToOrder(months, filterClass, resultHandler) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name',itemClass as 'Class',itemType as 'Type',i.qty as 'OnHand',sum(s.qty)/${months} as 'MonthlyUsage' from shipping s, items i where s.itemId = i.id and shippedAt > date_sub(curdate(), interval ${months*30} DAY) ${filter} group by s.itemId having MonthlyUsage > OnHand order by i.name,i.itemClass;`;
    const conn = pool.getConnection()
    .then( conn => {
        conn.query({rowsAsArray: false, sql: sql })
        .then( report => {
            resultHandler(undefined, report)
        })
        .catch( err => {
            console.log(err)
            resultHandler(err, undefined)
        })
        .finally( () => {
            conn.end();
        })
    })
    .catch( err => {    // getConnection()
        console.log(err)
        resultHandler(err, undefined)
    })
}

function needToOrderCSV( months, filterClass, file, resultHandler) {
    let result = {ok: false, nbrRows: 0}
    needToOrder(months, filterClass, (err, rows) => {
        if( err ) {
            resultHandler(err, result)
        } else {
            result.nbrRows = rows.length;
            if( rows.length > 0 ) {
                // convert to csv
                const csv = parse(rows)
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

module.exports = needToOrder;
module.exports.csv = needToOrderCSV;