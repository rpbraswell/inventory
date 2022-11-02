var express = require('express');
var router = express.Router();
var Category = require('../db/Category');


/* GET categories listing. */
router.get('/', async function(req, res, next) {
     try {
          let categories = await Category.getCategories();
          res.render('categories', {rows: categories});
     } catch(err) {
          res.render('error', {message: 'error getting categories', error: err, hostname: req.hostname});
     }
});



router.get('/add', (req, res, next) => {
     res.render('category_form', {name: 'Add Category' });
});

router.post('/', async (req, res, next) => {
     let category = new Category(req.body);
     try {
          await category.insert();
          res.redirect("/categories");
     } catch(err) {
          res.render('error', {message: 'error inserting new category', error: err, hostname: req.hostname});
     }

});

module.exports = router;
