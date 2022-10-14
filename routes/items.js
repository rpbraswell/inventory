var express = require('express');
var router = express.Router();
var Item = require('../db/Item');
var Category = require('../db/Category');
var Unit = require('../db/Unit');
var Shipping = require('../db/Shipping');
const itemsReport = require('../lib/reports/itemsReport.js');




/* GET items listing for mobile app */
router.get('/rest', function(req, res, next) {
    itemsReport( (err, items) => {
        if(err) {
            res.status(500).send(JSON.stringify(err));
        } else {
            res.status(200).send(JSON.stringify(items));
        }
    }); 
});

router.get('/add', (req, res, next) => {
      Category.getCategories( (err, categories) => {
        if(err) {
            res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
        } else {
           Unit.getUnits( (err, units) => {
                if(err) {
                    res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
                } else {
                    Item.getClassValues( (err, itemClasses) => {
                        if(err) {
                            res.render('error', {message: 'error getting item classes', error: err, hostname: req.hostname});
                        } else {
                            Item.getTypeValues( (err, itemTypes) => {
                                if(err) {
                                    res.render('error', {message: 'error getting item types', error: err, hostname: req.hostname});
                                } else {
                                    res.render('item_form', {hostname: req.hostname, name: 'Add Item', itemClasses: itemClasses, itemTypes: itemTypes, categories: categories, units: units, item: {}, messages: [] });
                                }
                            });
                        }
                    });
                }
           });
        }
    });
});

router.get('/update', (req, res, next) => {
    let id = Number(req.query.id);
    Category.getCategories( (err, categories) => {
        if(err) {
            res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
        } else {
            Unit.getUnits( (err, units) => {
                if(err) {
                    res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
                } else {
                   Item.getClassValues( (err, itemClasses) => {
                        if(err) {
                            res.render('error', {message: 'error getting item classes', error: err, hostname: req.hostname});
                        } else {
                            Item.getTypeValues( (err, itemTypes) => {
                                if(err) {
                                    res.render('error', {message: 'error getting item types', error: err, hostname: req.hostname});
                                } else {
                                    Item.getItemById(id,  (err, item) => {
                                        if(err) {
                                            res.render('error', {message: 'error getting item to update', error: err, hostname: req.hostname});
                                        } else {
                                            res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemClasses: itemClasses, itemTypes: itemTypes, item: item, categories: categories, units: units, messages: [] });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


router.get('/delete', (req, res, next) => {
    let id = Number(req.query.id);
    Item.deleteItem(id, (err, result) => {
        if(err) {
            res.render('error', {message: 'error deleting item', error: err, hostname: req.hostname}); 
        } else if(result.affectedRows == 0 ) {
            let error = new Error(`item does not exist for id ${id}`);
            res.render('error', {message: `unable to delete item with id ${id}`, error: error, hostname: req.hostname} );
        } else {
           res.redirect('/reports/items');
        }
    });
});


router.post('/', (req, res, next) => {
    let item = new Item(req.body);
    let operation = "";
        if( item.id ) {
            operation = "updating";
            item.isValid('update', (status) => {
                if( status.ok ) {
                    item.update(undefined, (err, result) => {
                        if( err ) {
                            res.render('error', {message: 'error updating item', error: err, hostname: req.hostname});
                        } else {
                            res.redirect('/reports/items'); 
                        }
                    });
                } else {
                    Category.getCategories( (err, categories) => {
                        if(err) {
                            res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
                        }  else {
                             Unit.getUnits( (err, units) => {
                                if(err) {
                                    res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
                                } else {
                                    Item.getClassValues( (err, itemClasses) => {
                                        if(err) {
                                            res.render('error', {message: 'error getting item class values', error: err, hostname: req.hostname});
                                        } else {
                                            Item.getTypeValues( (err, itemTypes) => {
                                                if(err) {
                                                    res.render('error', {message: 'error getting item type values', error: err, hostname: req.hostname});
                                                } else {
                                                    res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemTypes: itemTypes, itemClasses: itemClasses, categories: categories, units: units, item: item, messages: status.messages});
                                                }
                                            });
                                        }
                                    });
                                }
                         });
                        }
                      });
                  }
             });
        } else {
            operation = "inserting";
            item.isValid('insert', (status) => {
                if( status.ok ) {
                    item.insert(undefined, (err, result) => {
                        if( err ) {
                            res.render('error', {message: 'error inserting item', error: err, hostname: req.hostname});
                        } else {
                            res.redirect("/reports/items");
                        } 
                    });
                } else {
                    Category.getCategories( (err, categories) => {
                        if(err) {
                            res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
                        } else {
                             Unit.getUnits( (err, units) => {
                                if(err) {
                                    res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
                                } else {
                                     Item.getClassValues( (err, itemClasses) => {
                                        if(err) {
                                            res.render('error', {message: 'error getting item class values', error: err, hostname: req.hostname});
                                        } else {
                                             Item.getTypeValues( (err, itemTypes) => {
                                                if(err) {
                                                    res.render('error', {message: 'error getting item type values', error: err, hostname: req.hostname});
                                                } else {
                                                    res.render('item_form', {hostname: req.hostname, name: 'Add Item',itemTypes: itemTypes, itemClasses: itemClasses, categories: categories, units: units, item: item, messages: status.messages});
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

});

module.exports = router;
