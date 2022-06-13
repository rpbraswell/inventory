var express = require('express');
var router = express.Router();
var url  = require('url')
var Item = require('../db/Item');
var Category = require('../db/Category');
var Unit = require('../db/Unit');


/* GET items listing. */
router.get('/', function(req, res, next) {
   Item.getItems( (rows) => {
       // console.log(JSON.stringify(rows));
       res.render('items', { name: "Items", rows: rows});
   });
});

/* GET items listing for mobile app */
router.get('/rest', function(req, res, next) {
   console.log("got request for items");
   Item.getItems( (rows) => {
      res.status(200).send(JSON.stringify(rows));
   });
});

router.get('/add', (req, res, next) => {
      Category.getCategories( (categories) => {
           Unit.getUnits( (units) => {
               Item.getClassValues( (itemClasses) => {
                   // console.log(itemClasses);
                   Item.getTypeValues( (itemTypes) => {
                       // console.log(itemTypes);
                       res.render('item_form', {hostname: req.hostname, name: 'Add Item', itemClasses: itemClasses, itemTypes: itemTypes, categories: categories, units: units, item: {}, messages: [] });
                    });
                });
           });
      });
});

router.get('/update', (req, res, next) => {
      let query = url.parse(req.url).query;
      let id = Number(query);
      console.log(`id: ${id}`);
      Category.getCategories( (categories) => {
           Unit.getUnits( (units) => {
               Item.getClassValues( (itemClasses) => {
                   Item.getTypeValues( (itemTypes) => {
                      Item.getItemById(id,  (item) => {
                         // console.log(JSON.stringify(item));
                         res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.name}`, itemClasses: itemClasses, itemTypes: itemTypes, item: item, categories: categories, units: units, messages: [] });
                      });
                   });
               });
           });
      });
});


router.get('/delete', (req, res, next) => {
      let query = url.parse(req.url).query;
      let id = Number(query);
      console.log(`deleting item ${id}`);
      Item.getItemById(id, (item) => {
             if( item instanceof Item ) {
                console.log(`deleting item ${item.name}`);
                try {
                   Item.deleteItem(id, (result) => {
                       console.log(result);
                       res.redirect('/items');
                   }); 
                } catch(err) {
                    console.log(err);
                }
             }
      });
});

router.post('/', (req, res, next) => {
    let item = new Item(req.body);
    console.log(item)
    if( item.id ) {
         item.isValid('update', (status) => {
             if( status.ok ) {
                 item.update(undefined, (result) => {
                     if( result instanceof Item ) {
                         res.redirect('/items'); 
                     } else { 
                         res.render('message', {hostname: req.hostname, message: `failed to update item ${item.name}`});
                     }
                  });
              } else {
                  Category.getCategories( (categories) => {
                      Unit.getUnits( (units) => {
                        Item.getClassValues( (itemClasses) => {
                            Item.getTypeValues( (itemTypes) => {
                               res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.name}`, itemTypes: itemTypes, itemClasses: itemClasses, categories: categories, units: units, item: item, messages: status.messages});
                            });
                        });
                      });
                  });
              }
         });
    } else {
       item.isValid('insert', (status) => {
          console.log(JSON.stringify(status));
          if( status.ok ) {
              item.insert(undefined, (result) => {
                 if( result instanceof Item ) {
                    res.redirect("/items");
                 } else { 
                    res.render('message', {hostname: req.hostname, message: `failed to add item ${item.name}`});
                 }
              });
          } else {
              Category.getCategories( (categories) => {
                  Unit.getUnits( (units) => {
                    Item.getClassValues( (itemClasses) => {
                        Item.getTypeValues( (itemTypes) => {
                            res.render('item_form', {hostname: req.hostname, name: 'Add Item',itemTypes: itemTypes, itemClasses: itemClasses, categories: categories, units: units, item: item, messages: status.messages});
                        });
                    });
                 });
             });
          }
       });
    }

});



module.exports = router;
