var express = require('express');
var router = express.Router();
var Category = require('../db/Category');


/* GET categories listing. */
router.get('/', function(req, res, next) {
   Category.getCategories( (err, categories) => {
     if(err) {
          res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
     } else {
        res.render('categories', {rows: categories});
     }
   });
});



router.get('/add', (req, res, next) => {
     res.render('category_form', {name: 'Add Category' });
});

router.post('/', (req, res, next) => {
     let category = new Category(req.body);
     category.insert( undefined, (err, category) => {
          if( err ) {
               res.render('error', {message: 'error inserting new category', error: err, hostname: req.hostname});
          } else {
               res.redirect("/categories");
          }
     })

});

module.exports = router;
