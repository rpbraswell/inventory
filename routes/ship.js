var express = require('express');
var router = express.Router();
var Shipping = require('../db/Shipping');

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

module.exports = router;
