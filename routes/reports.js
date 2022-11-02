var express = require('express');
var router = express.Router();

const reportFile = require('../lib/utils/reportFile.js');
const needToOrder = require('../lib/reports/needToOrder.js');
const shippingReport = require('../lib/reports/shippingReport');
const receivingReport = require('../lib/reports/receivingReport');
const transferReport = require('../lib/reports/transferReport.js');
const itemsReport = require('../lib/reports/itemsReport.js');
const Item = require('../db/Item.js');

let filterClass = 'all';

router.get('/needToOrder', async (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    try {
          let report = await needToOrder(months, filterClass);
          res.render('needToOrder_report', {months: months, rows: report})
    } catch(err) {
           res.render('error', {message: 'error getting Need To Order report', error: err, hostname: req.hostname});
    }
})

router.get('/needToOrderCSV', async (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    let rptFile = reportFile(`need_to_order_${months}_months_${filterClass}_items`);
    try {
           let result = await needToOrder.csv(months, filterClass,  rptFile);
           if( result.ok ) {
               res.download(rptFile);
           } else {
               res.render('info', {message: 'nothing to order', hostname: req.hostname});
           }

    } catch(err) {
          res.render('error', {message: 'error getting shipping summary csv report', error: err, hostname: req.hostname});
    }
})

/*
 * Shipping Reports
 */

router.get('/shipping', async (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    try {
          let report = await shippingReport(days, filterClass);
          res.render('shipping_report', {days: days, rows: report})
    } catch(err) {
          res.render('error', {message: 'error getting shippping report', error: err, hostname: req.hostname});

    }
});

router.get('/shippingCSV', async (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    let rptFile = reportFile(`shipping_summary_${days}_days_${filterClass}_items`)
    try {
          let result = await shippingReport.csv(days, filterClass, rptFile);
          if( result.ok ) {
               res.download(rptFile);
           } else {
               res.render('info', {message: 'no shipping records are available', hostname: req.hostname});
           }
    } catch(err) {
          res.render('error', {message: 'error getting shippping report', error: err, hostname: req.hostname});
    }
});

router.get('/shippingDetails', async (req, res, next) => {
    const days = req.query.interval ? Number(req.query.interval) : 30;
    const sortField = req.query.sort? req.query.sort : "name";
    try {
          let report = await shippingReport.details(days, sortField, filterClass);
          res.render('shipping_report_details', {days: days, rows: report, sortField: sortField})
    } catch(err) {
          res.render('error', {message: 'error getting shippping report', error: err, hostname: req.hostname});
    }
});

/*
 *  receiving reports
 */
router.get('/receiving', async (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    try {
          let report = await receivingReport(days,filterClass);
          res.render('receiving_report', {days: days, rows: report})
    } catch(err) {
          res.render('error', {message: 'error getting receiving report', error: err, hostname: req.hostname});
    }
});

router.get('/receivingCSV', async (req, res, next) => {
    let days = req.query.interval ? Number(req.query.interval) : 30;
    let rptFile = reportFile(`receiving_summary_report_${days}_days_${filterClass}_items`)
    try {
          let result = await receivingReport.csv(days,filterClass,rptFile);
          if( result.ok ) {
               res.download(rptFile);
           } else {
               res.render('info', {message: 'no shipping records are available', hostname: req.hostname});
           }
    } catch(err) {
          res.render('error', {message: 'error getting receiving summary csv report', error: err, hostname: req.hostname});
    }
});

router.get('/receivingDetails', async (req, res, next) => {
    const days = req.query.interval ? Number(req.query.interval) : 30;
    const sortField = req.query.sort? req.query.sort : "name";
    try {
          let report = await receivingReport.details(days, sortField, filterClass);
          res.render('receiving_report_details', {days: days, rows: report, sortField: sortField})        
    } catch(err) {
           res.render('error', {message: 'error getting receiving report', error: err, hostname: req.hostname});         
    }
});


/*
 * Transfer reports
 */
router.get('/transfer', async (req, res, next) => {
     let days = req.query.interval ? Number(req.query.interval) : 30;
     try {
          let report = await transferReport(days, filterClass);
          res.render('transfer_report', {days: days, rows: report});
     } catch(err) {
          res.render('error', { message: 'error getting transfer report', error: err, hostname: req.hostname});
     }
});

router.get('/transferCSV', async (req, res, next) => {
     let days = req.query.interval ? Number(req.query.interval) : 30;
     let rptFile = reportFile(`transfer_summary_report_${days}_days_${filterClass}_items`)
     try {
          let result = await transferReport.csv(days, filterClass, rptFile);
          if( result.ok ) {
               res.download(rptFile);
           } else {
               res.render('info', {message: 'no trasnfer records are available', hostname: req.hostname});
           }
     } catch(err) {
          res.render('error', {message: 'error getting transfer summary csv report', error: err, hostname: req.hostname});
     }
});

router.get('/transferDetails', async (req, res, next) => {
     const days = req.query.interval ? Number(req.query.interval) : 30;
     const sortField = req.query.sort? req.query.sort : "name";
     try {
          let report = await transferReport.details(days, sortField, filterClass);
          res.render('transfer_report_details', {days: days, rows: report, sortField: sortField})
     } catch(err) {
          res.render('error', {message: 'error getting transfer report', error: err, hostname: req.hostname});
     }
});

/* 
 * Item reports
 */
router.get('/items', async function(req, res, next) {
     let filter = req.query.filter ? req.query.filter : filterClass;
     let search = req.query.search ? req.query.search : '';
     filterClass = filter;  //module scope
     let itemClassesPromise = Item.getClassValues();
     let itemsPromise = itemsReport(filter,search);
     Promise.all([itemClassesPromise, itemsPromise])
     .then( ([itemClasses, items]) => {
          res.render('items', {rows: items, filterClass: filter, search: search,  itemClasses: itemClasses});
     })
     .catch( (err) => {
          res.render('error', {message: 'error getting items', error: err, hostname: req.hostname});
     })
 });
 
router.get('/itemsCSV', async (req, res, next) => {
     let filter = req.query.filter ? req.query.filter : filterClass;
     let search = req.query.search ? req.query.search : '';
     let rptFile = reportFile(`${filter}_items` + (search ? `_search_${search}` : ""));
     filterClass = filter;
     try {
          let result = await itemsReport.csv(filter,search,rptFile);
          if( result.ok ) {
               res.download(rptFile);
          } else {
               res.render('info', {message: `no items to report`, hostname: req.hostname});
          }
     } catch (err) {
          res.render('error', {message: 'error getting items csv report', error: err, hostname: req.hostname});
     }
 });

 router.get('/itemShipments', async (req, res, next) => {
    let id = Number(req.query.id);
    try {
        let item = await Item.getItemById(id);
        let report = await itemsReport.itemShipments(id);
        res.render('item_shipping_report', { item: item, rows: report})
    } catch(err) {
        res.render('error', {message: 'error getting shipping report', error: err, hostname: req.hostname}); 
    }
 });
 
module.exports = router