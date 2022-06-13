var express = require('express');
var router = express.Router();
var Receiving = require('../db/Receiving');

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

module.exports = router;
