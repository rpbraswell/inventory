var express = require('express');
var router = express.Router();
var Transfer = require('../db/Transfer');
var Item = require('../db/Item');

router.post('/rest', (req, res, next) => {
    let transfer = new Transfer(req.body);
    Transfer.transferItem(transfer, (err, result) => {
         if(err) {
               console.log(err.message);
               res.writeHead(500, {'Content-Type': 'text/html'});
               res.write(`<div><p>${err.message}</p></div>`);
               res.end();
         } else {
               console.log(`successfully transfered ${transfer}`)
               res.writeHead(200, {'Content-Type': 'text/html'});
               res.write(`<div><p>successfully received ${req.body.qty} ${req.body.name}</p></div>`);
               res.end();
         }
    });
});

router.get('/', (req, res, next) => {
     let id = Number(req.query.id);
     Item.getClassValues( (err, itemClasses) => {
          if(err) {
               res.render('error', {message: 'unable to get class values', error: err, hostname: req.hostname} );
          }  else {
               Item.getItemById(id, (err, item) => {
                    if(err) {
                         res.render('error', {message: 'could not find item to transfer', error: err, hostname: req.hostname} );
                    } else {
                         res.render('transfer_form', {hostname: req.hostname, item: item, itemClasses: itemClasses.filter( (e) => {return e != item.itemClass})});
                    }
               });
          }
     });       
 });

 router.post("/", (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     let toClass = req.body.toClass;
     Item.getItemById(id, (err, item) => {                 
          if(err) {
               res.render('error',{message: 'error transferring item: could not locate item to transfer from', error: err, hostname: req.hostname} )
          } else {
               Item.findByNameAndClassAndType(item.name, toClass, item.itemType, (err, toItem) => {
                    if(err) {
                         // database error
                         res.render('error', {message: 'error getting item to transfer to', error: err, hostname: req.hostname});
                    } else if(!toItem) {
                         let notFound = new Error( `you must first define item '${item.name} ${toClass} ${item.itemType}' before you can transfer to it`);
                         res.render('error', { message: 'item not found', error: notFound, hostname: req.hostname});
                    } else {
                         Transfer.transferItem(item, toItem, qty, (err, result) => {                    
                              if(err) {
                                  res.render('error', {message: 'error transferring item', error: err, hostname: req.hostname});
                              } else {
                                   res.redirect("/items");
                              }
                         });
                    }
               })
          }
     })
})

module.exports = router;
