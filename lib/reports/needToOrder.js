const pool = require('../../db/db.js')
const { parse } = require('json2csv')
const fs = require('fs')

function needToOrder(months, resultHandler) {
    let sql = `select i.name as 'Name',itemClass as 'Class',itemType as 'Type',i.qty as 'OnHand',sum(s.qty)/${months} as 'MonthlyUsage' from shipping s, items i where s.itemId = i.id and shippedAt > date_sub(curdate(), interval ${months*30} DAY) group by s.itemId having MonthlyUsage > OnHand;`;
    const conn = pool.getConnection()
    .then( conn => {
        conn.query({rowsAsArray: false, sql: sql })
        .then( rows => {
            resultHandler(undefined, rows)
        })
        .catch( err => {
            console.log(err)
            resultHandler(err, [])
        })
        .finally( () => {
            conn.end();
        })
    })
    .catch( err => {    // getConnection()
        console.log(err)
        resultHandler(err,[])
    })
}

function needToOrderCSV( months, file, resultHandler) {
    needToOrder(months, (err, rows) => {
        if( err ) {
            resultHandler(err, [])
        } else {
            if( rows.length > 0 ) {
                // convert to csv
                const csv = parse(rows)
                fs.writeFile(file, csv, (err) => {
                    if(err) {
                        resultHandler(err,[])
                    } else {
                        resultHandler(undefined, "success")
                    }
                })
            } else {
                resultHandler(new Error("you don't need to order anything"), [])
            }
        }
    })
}

module.exports = needToOrder;
module.exports.csv = needToOrderCSV;