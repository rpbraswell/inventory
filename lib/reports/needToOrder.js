import pool from '../../db/db.js'
import { parse } from 'json2csv'
import fs from 'fs'
const fsPromises = fs.promises;

async function needToOrder(months, filterClass) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let sql = `select i.name as 'Name',itemClass as 'Class',itemType as 'Type',i.qty as 'OnHand',sum(s.qty)/${months} as 'MonthlyUsage' from shipping s, items i where s.itemId = i.id and shippedAt > date_sub(curdate(), interval ${months*30} DAY) ${filter} group by s.itemId having MonthlyUsage > OnHand order by i.name,i.itemClass;`;
    return pool.query(sql);
}

async function needToOrderCSV( months, filterClass, file) {
    let report = await needToOrder(months, filterClass);
    if( report.length > 0 ) {
        // convert to csv
        const csv = parse(report)
        await fsPromises.writeFile(file, csv);
        return Promise.resolve({ok: true})
    } else {
        return Promise.resolve({ok: false});
    }
}

needToOrder.csv = needToOrderCSV;

export default needToOrder;