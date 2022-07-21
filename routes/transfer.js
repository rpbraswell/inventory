var express = require('express');
var router = express.Router();
var Transfer = require('../db/Transfer');
var url  = require('url');
var Item = require('../db/Item');

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
     console.trace(`transferring ${id} ${qty} ${toClass}`);
     Item.getItemById(id, (item) => {        
          if( item instanceof Item) {
               console.log(`found item to transfer ${item.name} ${item.itemClass} ${item.itemType}`)
               Transfer.transferItem(item, qty, toClass, (result) => {
                    if( result instanceof Item) {
                         res.redirect("/items");
                    } else {
                         let error = new Error(result.text);
                         res.render('error', {message: 'error transferring item: result is not an instance of Item', error: error, hostname: req.hostname});
                    }
               });
          } else {
               console.trace(item);
               let error = new Error(item.text);
               res.render('error',{message: 'error transferring item: could not locate item to transfer', error: error, hostname: req.hostname} )
          }
     })
})

router.get('/report', (req, res, next) => {
     let query = url.parse(req.url).query;
     const [interval, days] = query.split("=");
     try {
        Transfer.intervalTransfer(days, (result) => {
          console.log(JSON.stringify(result));
          res.render('transfer_report', {days: days, rows: result})
     }); 
     } catch(err) {
        console.log(err);
     }
});

module.exports = router;
