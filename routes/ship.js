var express = require('express');
var router = express.Router();
var Shipping = require('../db/Shipping');
var url  = require('url');
var Item = require('../db/Item');

router.post('/rest', (req, res, next) => {
     let name = req.body.name;
     let itemClass = req.body.itemClass;
     let itemType = req.body.itemType;
     let qty = Number(req.body.qty);
     Item.findByNameAndClassAndType(name, itemClass, itemType, (item) => {
          if( item instanceof Item ) {
               Shipping.shipItem(item, qty, (result) => {
                    if( result instanceof Shipping ) {
                         res.writeHead(200, {'Content-Type': 'text/html'});
                         res.write(`<div><p>successfully shipped ${qty} ${name}</p></div>`);
                         res.end();
                    } else {
                         let errorMessage = JSON.stringify(result);
                         console.log(`could not ship ${itemType} ${itemClass}, ${name} ${errorMessage} sending 500 code`);
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
            res.render('shipping_form', {item: item});
         }
     })
});

router.post("/", (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     console.log(`shipping ${id} ${qty}`);
     Item.getItemById(id, (item) => {        
          if( item instanceof Item) {
               console.log(`found item to ship ${item.name} ${item.itemClass} ${item.itemType}`)
               Shipping.shipItem(item, qty, (result) => {
                    if( result instanceof Shipping) {
                         res.redirect("/items");
                    } else {
                         let error = new Error(result.text);
                         res.render('error', {message: 'error shipping item: result is not an instance of Shipping', error: error, hostname: req.hostname});
                    }
               });
          } else {
               console.log(item);
               let error = new Error(item.text);
               res.render('error',{message: 'error shipping item: could not locate item to ship', error: error, hostname: req.hostname} )
          }
     })
})

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
