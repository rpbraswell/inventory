var express = require('express');
var router = express.Router();
var Receiving = require('../db/Receiving');
var url  = require('url');

router.post('/', (req, res, next) => {
    console.log(`received: ` + JSON.stringify(req.body));
    Receiving.receiveItem(Number(req.body.qty), req.body.itemType, req.body.itemClass, req.body.name, (result) => {
         if( result instanceof Receiving ) {
              console.log(`successfully received ${req.body.qty} ${req.body.itemType} ${req.body.itemClass} ${req.body.name}`)
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

router.get('/report', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     try {
        Receiving.intervalReceived(days, (result) => {
          console.log(JSON.stringify(result));
          res.render('receiving_report', {days: days, rows: result})
     }); 
     } catch(err) {
        console.log(err);
     }
});

module.exports = router;
