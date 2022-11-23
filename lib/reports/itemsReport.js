import pool from '../../db/db.js'
import { parse } from 'json2csv'
import fs from 'fs';
const fsPromises = fs.promises;

async function itemsReport(filterClass, _search) {
    let filter = filterClass == "all" ? '' : `and i.itemClass = '${filterClass}'`;
    let search = _search == '' ? '' : `and i.name regexp '${_search}'`;
    let sql = `select i.id as Id,i.name as Name,i.itemClass as ItemClass,i.itemType as ItemType,c.category as Category,u.unit as Unit,i.pkgQty as PackageQty,i.qty as OnHand,DATE_FORMAT(i.lastUpdate,"%M %d %Y %r") as LastUpdate from items i, categories c, units u where i.category=c.id and i.unit=u.id ${filter} ${search} order by i.name,i.itemClass,i.itemType`;
    return pool.query( {rowsAsArray: false,  sql: sql } );
 }

async function itemNames() {
    let itemNames = [];
    let items = await itemsReport('all','');
    items.forEach( (item) => {
        itemNames.push(`${item.name}:${item.itemClass}:${item.itemType}`);
    });
    return Promise.resolve(itemNames);
}

async function itemsReportCSV(filterClass, _search, file) {
    let report = await itemsReport(filterClass, _search);
    if( report.length > 0 ) {
        // delete the Id property since it is not useful for the csv report
        for(let item of report) {
            delete item.Id;
        }
        // convert to csv
        const csv = parse(report)
        await fsPromises.writeFile(file, csv);
        return Promise.resolve({ok: true})
    } else {
        return Promise.resolve({ok: false});
    }
}

async function itemShipments( id ) {
    let sql = "select DATE_FORMAT(shippedAt,'%Y') as 'Year', monthname(shippedAt) as 'Month', sum(qty) as 'Shipments' from shipping where itemId=? group by DATE_FORMAT(shippedAt,'%Y'), monthname(shippedAt) order by DATE_FORMAT(shippedAt,'%Y'), month(shippedAt) DESC";
    return pool.query(sql,[id]);
}

itemsReport.csv = itemsReportCSV;
itemsReport.names = itemNames;
itemsReport.itemShipments = itemShipments;

export default itemsReport;
