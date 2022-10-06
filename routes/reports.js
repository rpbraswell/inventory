var express = require('express');
var router = express.Router();
var url  = require('url');
const reportFile = require('../lib/utils/reportFile.js');

let needToOrder = require('../lib/reports/needToOrder.js');

router.get('/needToOrder', (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    needToOrder(months, (err, rows) => {
        if( err) {
            res.render('error', {message: 'error getting Need To Order report', error: err, hostname: req.hostname});
        } else {
            res.render('needToOrder_report', {months: months, rows: rows})
        }
    })
})

router.get('/needToOrderCSV', (req,res,next) => {
    let months = 2;
    if( req.query.months ) {
        months = Number(req.query.months);
    }
    let rptFile = reportFile(`need_to_order_${months}_months`);

    needToOrder.csv(months, rptFile, (err, result) => {
       if( err ) {
          res.render('error', {message: 'error getting shipping summary csv report', error: err, hostname: req.hostname});
       } else {
          res.download(rptFile);
       }

    })
})


module.exports = router