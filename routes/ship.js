var express = require('express');
var router = express.Router();
var Shipping = require('../db/Shipping');
var Item = require('../db/Item');

router.post('/rest', (req, res, next) => {
     let name = req.body.name;
     let itemClass = req.body.itemClass;
     let itemType = req.body.itemType;
     let qty = Number(req.body.qty);
     Item.findByNameAndClassAndType(name, itemClass, itemType, (err, item) => {
          if(err) {
               console.log(`could not ship ${itemType} ${itemClass}, ${name} ${err.message} sending 500 code`);
               res.writeHead(500, {'Content-Type': 'text/html'});
               res.write(`<div><p>Internal Error</p></div>`);
               res.end();
          } else {
               Shipping.shipItem(item, qty, (err, result) => {
                    if(err) {
                         console.log(`could not ship ${itemType} ${itemClass}, ${name} ${err.message} sending 500 code`);
                         res.writeHead(500, {'Content-Type': 'text/html'});
                         res.write(`<div><p>Internal Error</p></div>`);
                         res.end();
                    } else {
                         res.writeHead(200, {'Content-Type': 'text/html'});
                         res.write(`<div><p>successfully shipped ${qty} ${name}</p></div>`);
                         res.end();
                    }
               });
          }
 
     });
});

router.get("/", (req, res, next) => {
     let id = Number(req.query.id);
     Item.getItemById(id, (err, item) => {
         if( err ) {
                res.render('error', {message: 'error getting item to ship', error: err, hostname: req.hostname});
         } else {
                res.render('shipping_form', {item: item});
         }
     })
});

router.post("/", (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     Item.getItemById(id, (err, item) => {                   
          if(err) {
               res.render('error',{message: 'error shipping item: could not locate item to ship', error: err, hostname: req.hostname} )
          } else {
               Shipping.shipItem(item, qty, (err, result) => {
                    if(err) {
                         res.render('error', {message: 'unable to ship item ${item.name} ${item.itemClass} ${item.itemType}', error: err, hostname: req.hostname});
                    } else {
                         res.redirect("/items");
                    }
               });
          }
     })
})

module.exports = router;
