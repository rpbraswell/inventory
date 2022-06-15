var express = require('express');
var router = express.Router();
var Category = require('../db/Category');


/* GET categories listing. */
router.get('/', function(req, res, next) {
   Category.getCategories( (rows) => {
       res.render('categories', {rows: rows});
   });
});



router.get('/add', (req, res, next) => {
     res.render('category_form', {name: 'Add Category' });
});

router.post('/', (req, res, next) => {
    Category.addCategory( { category: req.body.category}, (result) => {
         if( result instanceof Category ) {
              res.redirect("categories");
         } else { 
              res.end(JSON.stringify(result));
         }
    });

});

module.exports = router;
