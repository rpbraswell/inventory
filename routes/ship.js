var express = require('express');
var router = express.Router();
var Shipping = require('../db/Shipping');
var url  = require('url');

router.post('/', (req, res, next) => {

    Shipping.shipItem(Number(req.body.qty), req.body.itemType, req.body.itemClass, req.body.name, (result) => {
         console.log(`shipped: ` + JSON.stringify(req.body));
         if( result instanceof Shipping ) {
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.write(`<div><p>successfully shipped ${req.body.qty} ${req.body.name}</p></div>`);
              res.end();
         } else {
              let errorMessage = JSON.stringify(result);
              console.log(`could not ship ${req.body.itemType} ${req.body.itemClass}, ${req.body.name} ${errorMessage} sending 500 code`);
              res.writeHead(500, {'Content-Type': 'text/html'});
              res.write(`<div><p>Internal Error</p></div>`);
              res.end();
         }
    });
});

router.get('/report', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     try {
        Shipping.intervalShipped(days, (result) => {
          console.log(JSON.stringify(result));
          res.render('shipping_report', {days: days, rows: result})
     }); 
     } catch(err) {
        console.log(err);
     }
});
module.exports = router;
