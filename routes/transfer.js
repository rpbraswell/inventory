var express = require('express');
var router = express.Router();
var Transfer = require('../db/Transfer');
var url  = require('url');
var Item = require('../db/Item');
var path = require('path');

router.post('/rest', (req, res, next) => {
    console.log(`trasfer: ` + JSON.stringify(req.body));
    let transfer = new Transfer(req.body);
    Transfer.transferItem(transfer, (result) => {
         if( result instanceof Transfer ) {
              console.log(`successfully transfered ${transfer}`)
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.write(`<div><p>successfully received ${req.body.qty} ${req.body.name}</p></div>`);
              res.end();
         } else {
              let errorMessage = JSON.stringify(result);
              console.log(errorMessage);
              res.writeHead(500, {'Content-Type': 'text/html'});
              res.write(`<div><p>${errorMessage}</p></div>`);
              res.end();
         }
    });
});

router.get('/', (req, res, next) => {
     let query = url.parse(req.url).query;
     let id = Number(query);
     Item.getClassValues( (itemClasses) => {
         Item.getItemById(id, (item) => {
               if( item instanceof Item ) {
                    res.render('transfer_form', {hostname: req.hostname, item: item, itemClasses: itemClasses.filter( (e) => {return e != item.itemClass})});
               } else {
                    let error = new Error(JSON.stringify(item));
                    res.render('error', {message: `could not find item to transfer`, error: error, hostname: req.hostname} );
               }
          });
     });
         
 });

 router.post("/", (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     let toClass = req.body.toClass;
     Item.getItemById(id, (item) => {        
          if( item instanceof Item) {
               Transfer.transferItem(item, qty, toClass, (result) => {
                    if( result instanceof Item) {
                         res.redirect("/items?filter=all");
                    } else {
                         let error = new Error(result.text);
                         res.render('error', {message: 'error transferring item: result is not an instance of Item', error: error, hostname: req.hostname});
                    }
               });
          } else {
               let error = new Error(item.text);
               res.render('error',{message: 'error transferring item: could not locate item to transfer', error: error, hostname: req.hostname} )
          }
     })
})

router.get('/report', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     Transfer.intervalTransfer(days, (result) => {
          if( Array.isArray(result)) {
               res.render('transfer_report', {days: days, rows: result});
          } else {
               res.render('error', { message: 'error getting transfer report', error: result, hostname: req.hostname});
          }
     }); 
});

router.get('/report/csv', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     console.log("qyery: ", query);

     let reportDir = process.env.REPORT_DIRECTORY;
     let date = new Date();
     let reportName = `transfer_summary_report_${days}d_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.csv`;
     let reportFile = path.join(reportDir, reportName);
     reportFile = reportFile.replace(/\\/g, '/')

     console.log("reportFile: ",reportFile);
    
     Transfer.intervalTransferredCSV(days, reportFile, (result) => {
          if( result  == "success" ) {
               res.download(reportFile);
          } else {
               res.render('error', {message: 'error getting transfer summary csv report', error: result, hostname: req.hostname});
          }
     }); 
});

router.get('/report/details', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [q1, q2 ] = query.split("&");
     const [interval, days] = q1.split("=");
     const [ sort, sortField ] = q2.split("=");
     Transfer.intervalTransferredDetails(days, sortField, (result) => {
          if( Array.isArray(result)) {
               res.render('transfer_report_details', {days: days, rows: result, sortField: sortField})
          } else {
               res.render('error', {message: 'error getting transfer report', error: result, hostname: req.hostname});
          }
     }); 
});

module.exports = router;
