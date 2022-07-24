var express = require('express');
var router = express.Router();
var Receiving = require('../db/Receiving');
var url  = require('url');
var Item = require('../db/Item');
var path = require('path');

router.post('/rest', (req, res, next) => {
    console.log(`received: ` + JSON.stringify(req.body));
    let name = req.body.name;
    let itemClass = req.body.itemClass;
    let itemType = req.body.itemType;
    let qty = Number(req.body.qty);
    Item.findByNameAndClassAndType(name, itemClass, itemType, (item) => {
          if( item instanceof Item ) {
               Receiving.receiveItem(item, qty, (result) => {
                    if( result instanceof Receiving ) {
                         res.writeHead(200, {'Content-Type': 'text/html'});
                         res.write(`<div><p>successfully received ${qty} ${name}</p></div>`);
                         res.end();
                    } else {
                         let errorMessage = JSON.stringify(result);
                         console.log(`could not receove ${itemType} ${itemClass}, ${name} ${errorMessage} sending 500 code`);
                         res.writeHead(500, {'Content-Type': 'text/html'});
                         res.write(`<div><p>Internal Error</p></div>`);
                         res.end();
                    }
               });
          } else {
               let errorMessage = JSON.stringify(item);
               console.log(`could not ship ${itemType} ${itemClass}, ${name} ${errorMessage} sending 500 code`);
               res.writeHead(500, {'Content-Type': 'text/html'});
               res.write(`<div><p>Internal Error</p></div>`);
               res.end();
          }
     });
});

router.get("/", (req, res, next) => {
     let query = url.parse(req.url).query;
     let id = Number(query);
     Item.getItemById(id, (item) => {
         if( item instanceof Item ) {
            res.render('receiving_form', {item: item});
         }
     })
});

router.post("/", (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     console.log(`receiving ${id} ${qty}`);
     Item.getItemById(id, (item) => {        
          if( item instanceof Item) {
               console.log(`found item to receive ${item.name} ${item.itemClass} ${item.itemType}`)
               Receiving.receiveItem(item, qty, (result) => {
                    if( result instanceof Receiving) {
                         res.redirect("/items");
                    } else {
                         let error = new Error(result.text);
                         res.render('error', {message: 'error receiving item: result is not an instance of Shipping', error: error, hostname: req.hostname});
                    }
               });
          } else {
               console.log(item);
               let error = new Error(item.text);
               res.render('error',{message: 'error receiving item: could not locate item to ship', error: error, hostname: req.hostname} )
          }
     })
});

router.get('/report', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     Receiving.intervalReceived(days, (result) => {
          if( Array.isArray(result)) {
               res.render('receiving_report', {days: days, rows: result})
          } else {
               res.render('error', {message: 'error getting receiving report', error: result, hostname: req.hosthame});
          }
     }); 
});

router.get('/report/csv', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     console.log("qyery: ", query);

     let reportDir = process.env.REPORT_DIRECTORY;
     let date = new Date();
     let reportName = `receive_summary_report_${days}d_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.csv`;
     let reportFile = path.join(reportDir, reportName);
     reportFile = reportFile.replace(/\\/g, '/')

     console.log("reportFile: ",reportFile);
    
     Receiving.intervalReceivedCSV(days, reportFile, (result) => {
          if( result  == "success" ) {
               res.download(reportFile);
          } else {
               res.render('error', {message: 'error getting receiving summary csv report', error: result, hostname: req.hostname});
          }
     }); 
});

router.get('/report/details', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [q1, q2 ] = query.split("&");
     const [interval, days] = q1.split("=");
     const [ sort, sortField ] = q2.split("=");
     Receiving.intervalReceivedDetails(days, sortField, (result) => {
          if( Array.isArray(result)) {
               res.render('receiving_report_details', {days: days, rows: result, sortField: sortField})
          } else {
               res.render('error', {message: 'error getting receiving report', error: result, hostname: req.hostname});
          }
     }); 
});

module.exports = router;
