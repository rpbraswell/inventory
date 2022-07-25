var express = require('express');
var router = express.Router();
var url  = require('url')
var Item = require('../db/Item');
var Category = require('../db/Category');
var Unit = require('../db/Unit');
var path = require('path');

/* GET items listing. */
router.get('/', function(req, res, next) {
    let query = url.parse(req.url).query;
    console.log(query);
    let [filter, filterClass] = query.split("=");
    Item.getClassValues( (itemClasses) => {
        Item.getItems(filterClass, (rows) => {
            res.render('items', {rows: rows, filterClass: filterClass, itemClasses: itemClasses});
        });
    })
});

router.get('/report/csv', (req, res, next) => {
    let query = url.parse(req.url).query;
    console.log(query);
    let [filter, filterClass] = query.split("=");
    console.log("qyery: ", query);

    let reportDir = process.env.REPORT_DIRECTORY;
    let date = new Date();
    let reportName = `item_report_${filterClass}_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.csv`;
    let reportFile = path.join(reportDir, reportName);
    reportFile = reportFile.replace(/\\/g, '/')

    console.log("reportFile: ",reportFile);
   
    Item.itemsCSV(filterClass, reportFile, (result) => {
         if( result  == "success" ) {
              res.download(reportFile);
         } else {
              res.render('error', {message: 'error getting item csv report', error: result, hostname: req.hostname});
         }
    }); 
});

/* GET items listing for mobile app */
router.get('/rest', function(req, res, next) {
    try {
        Item.getItems( (rows) => {
            res.status(200).send(JSON.stringify(rows));
        });
    } catch(err) {
        res.status(500).send(JSON.stringify(err));
    }
});

router.get('/add', (req, res, next) => {
    try {
      Category.getCategories( (categories) => {
           Unit.getUnits( (units) => {
               Item.getClassValues( (itemClasses) => {
                   Item.getTypeValues( (itemTypes) => {
                       res.render('item_form', {hostname: req.hostname, name: 'Add Item', itemClasses: itemClasses, itemTypes: itemTypes, categories: categories, units: units, item: {}, messages: [] });
                    });
                });
           });
      });
    } catch(err) {
        res.render('error', {message: `error getting information for adding new item`, error: err} );
    }
});

router.get('/update', (req, res, next) => {
    let query = url.parse(req.url).query;
    let id = Number(query);
    try {
        Category.getCategories( (categories) => {
            Unit.getUnits( (units) => {
                Item.getClassValues( (itemClasses) => {
                    Item.getTypeValues( (itemTypes) => {
                        Item.getItemById(id,  (item) => {
                            res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemClasses: itemClasses, itemTypes: itemTypes, item: item, categories: categories, units: units, messages: [] });
                        });
                    });
                });
            });
        });
    } catch(err) {
        res.render('error', {message: `error getting information for item to update for id ${id}`, error: err} );
    }
});


router.get('/delete', (req, res, next) => {
    let query = url.parse(req.url).query;
    let id = Number(query);
    // if any kind of a result is returned then there was no error
    Item.deleteItem(id, (result) => {
        if( result.affectedRows == 1 ) {
           res.redirect('/items');
        } else if(result.affectedRows === 0 ) {
            let error = new Error("item does not exist");
            console.log(error);
            res.render('error', {message: `unable to delete item with id ${id}`, error: error, hostname: req.hostname} );
        } else {
            res.render('error', {message: `unable to delete item with id ${id}`, error: new Error(result.text), hostname: req.hostname} );
        }
    });
});

router.post('/', (req, res, next) => {
    let item = new Item(req.body);
    let operation = "";
    try {
        if( item.id ) {
            operation = "updating";
            item.isValid('update', (status) => {
                if( status.ok ) {
                    item.update(undefined, (result) => {
                        if( result instanceof Item ) {
                             res.redirect('/items'); 
                        }
                    });
                } else {
                    Category.getCategories( (categories) => {
                        Unit.getUnits( (units) => {
                            Item.getClassValues( (itemClasses) => {
                                Item.getTypeValues( (itemTypes) => {
                                   res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemTypes: itemTypes, itemClasses: itemClasses, categories: categories, units: units, item: item, messages: status.messages});
                                });
                            });
                         });
                      });
                  }
             });
        } else {
            operation = "inserting";
            item.isValid('insert', (status) => {
                //console.log(JSON.stringify(status));
                if( status.ok ) {
                    item.insert(undefined, (result) => {
                        if( result instanceof Item ) {
                            res.redirect("/items");
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
    } catch(err) { 
        res.render('error', {message: `error ${operation} item`, error: err} );
    }

});



module.exports = router;
