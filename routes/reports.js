var express = require('express');
var router = express.Router();
var url  = require('url');
const reportFile = require('../lib/utils/reportFile.js');

const needToOrder = require('../lib/reports/needToOrder.js');
const shippingReport = require('../lib/reports/shippingReport');
const receivingReport = require('../lib/reports/receivingReport');
const transferReport = require('../lib/reports/transferReport.js');
const itemsReport = require('../lib/reports/itemsReport.js');

let filterClass = 'all';

router.get('/needToOrder', (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    needToOrder(months, filterClass, (err, report) => {
        if( err) {
            res.render('error', {message: 'error getting Need To Order report', error: err, hostname: req.hostname});
        } else {
            res.render('needToOrder_report', {months: months, rows: report})
        }
    })
})

router.get('/needToOrderCSV', (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    let rptFile = reportFile(`need_to_order_${months}_months_${filterClass}_items`);

    needToOrder.csv(months, filterClass,  rptFile, (err, result) => {
       if( err ) {
          res.render('error', {message: 'error getting shipping summary csv report', error: err, hostname: req.hostname});
       } else if( result.nbrRows == 0 ) {  // csv file not generated
          res.render('info', {message: 'nothing to order', hostname: req.hostname});
       } else {
          res.download(rptFile);
       }
    })
})

/*
 * Shipping Reports
 */

router.get('/shipping', (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    shippingReport(days, filterClass, (err, report) => {
         if(err) {
              res.render('error', {message: 'error getting shippping report', error: err, hostname: req.hostname});
         } else {
              res.render('shipping_report', {days: days, rows: report})
         }
    }); 
});

router.get('/shippingCSV', (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    let rptFile = reportFile(`shipping_summary_${days}_days_${filterClass}_items`)
   
    shippingReport.csv(days, filterClass, rptFile, (err, result) => {
         if(err) {
              res.render('error', {message: 'error getting shipping summary csv report', error: err, hostname: req.hostname});
         } else if(result.nbrRows == 0 ) {
            res.render('info', {message: `no shipping to report in the last ${days} days`, hostname: req.hostname});
         } else {
              res.download(rptFile);
         }
    }); 
});

router.get('/shippingDetails', (req, res, next) => {
    const days = req.query.interval ? Number(req.query.interval) : 30;
    const sortField = req.query.sort? req.query.sort : "name";
    shippingReport.details(days, sortField, filterClass, (err, report) => {
         if(err) {
              res.render('error', {message: 'error getting shippping report', error: err, hostname: req.hostname});
         } else {
              res.render('shipping_report_details', {days: days, rows: report, sortField: sortField})
         }
    }); 
});

/*
 *  receiving reports
 */
router.get('/receiving', (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    receivingReport(days, filterClass, (err, report) => {      
         if(err) {
              res.render('error', {message: 'error getting receiving report', error: err, hostname: req.hostname});
         } else {
              res.render('receiving_report', {days: days, rows: report})
         }
    }); 
});

router.get('/receivingCSV', (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    let rptFile = reportFile(`receiving_summary_report_${days}_days_${filterClass}_items`)
    receivingReport.csv(days, filterClass, rptFile, (err, result) => {
         if( err ) {
              res.render('error', {message: 'error getting receiving summary csv report', error: err, hostname: req.hostname});
         } else if(result.nbrRows == 0 ) {
              res.render('info', {message: `no receiving to report in the last ${days} days`, hostname: req.hostname});
         } else {
              res.download(rptFile);
         }
    }); 
});

router.get('/receivingDetails', (req, res, next) => {
    const days = req.query.interval ? Number(req.query.interval) : 30;
    const sortField = req.query.sort? req.query.sort : "name";
    receivingReport.details(days, sortField, filterClass, (err, report) => {
         if( err ) {
              res.render('error', {message: 'error getting receiving report', error: err, hostname: req.hostname});         
         } else {
              res.render('receiving_report_details', {days: days, rows: report, sortField: sortField})        
         }
    }); 
});


/*
 * Transfer reports
 */
router.get('/transfer', (req, res, next) => {
     let days = req.query.interval ? Number(req.query.interval) : 30;
     transferReport(days, filterClass, (err, report) => {     
          if(err) {
               res.render('error', { message: 'error getting transfer report', error: err, hostname: req.hostname});
          } else {
               res.render('transfer_report', {days: days, rows: report});
          }
     }); 
});

router.get('/transferCSV', (req, res, next) => {
     let days = req.query.interval ? Number(req.query.interval) : 30;
     let rptFile = reportFile(`transfer_summary_report_${days}_days_${filterClass}_items`)
     transferReport.csv(days, filterClass, rptFile, (err, result) => {
          if(err) {
               res.render('error', {message: 'error getting transfer summary csv report', error: err, hostname: req.hostname});
          } else if(result.nbrRows == 0 ) {
               res.render('info', {message: `no transfers to report in the last ${days} days`, hostname: req.hostname});
          } else {
               res.download(rptFile);
          }
     }); 
});

router.get('/transferDetails', (req, res, next) => {
     const days = req.query.interval ? Number(req.query.interval) : 30;
     const sortField = req.query.sort? req.query.sort : "name";
     transferReport.details(days, sortField, filterClass, (err, report) => {       
          if(err) {
               res.render('error', {message: 'error getting transfer report', error: err, hostname: req.hostname});
          } else {
               res.render('transfer_report_details', {days: days, rows: report, sortField: sortField})
          }
     }); 
});

/* 
 * Item reports
 */
router.get('/items', function(req, res, next) {
     let filter = req.query.filter ? req.query.filter : filterClass;
     let search = req.query.search ? req.query.search : '';
     filterClass = filter;  //module scope
     Item.getClassValues( (err, itemClasses) => {
         if( err ) {
             res.render('error', {message: 'error getting item classes', error: err, hostname: req.hostname});
         } else {
             itemsReport(filter, search, (err, items) => {
                 if(err) {
                     res.render('error', {message: 'error getting items', error: err, hostname: req.hostname});
                 } else {
                     res.render('items', {rows: items, filterClass: filter, search: search,  itemClasses: itemClasses});
                 }
             });
         }
     })
 });
 
router.get('/itemsCSV', (req, res, next) => {
     let filter = req.query.filter ? req.query.filter : filterClass;
     let search = req.query.search ? req.query.search : '';
     let rptFile = reportFile(`${filter}_items` + (search ? `_search_${search}` : ""));
     filterClass = filter;
     console.log(rptFile)
 
     itemsReport.csv(filter, search, rptFile, (err, result) => {
          if( err ) {
             res.render('error', {message: 'error getting items csv report', error: err, hostname: req.hostname});
          } else {
             res.download(rptFile);
          }
     }); 
 });

 router.get('/itemShipments', (req, res, next) => {
     let id = Number(req.query.id);
     Item.getItemById(id, (err, item) => {
         if(err) {
             res.render('error', {message: 'error getting item', error: err, hostname: req.hostname}); 
         } else {
             itemsReport.itemShipments(id, (err, report) => {
                 if(err) {
                     res.render('error', {message: 'error getting shipping report', error: err, hostname: req.hostname}); 
                 } else {
                     res.render('item_shipping_report', { item: item, rows: report})
                 }
             });
         }
     });
 });
 
module.exports = router