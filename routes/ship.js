var express = require('express');
var router = express.Router();
var Item = require('../db/Item');

router.get("/", async (req, res, next) => {
     let id = Number(req.query.id);
     try {
          let item = await Item.getItemById(id);
          res.render('shipping_form', {item: item});
     } catch(err) {
          res.render('error', {message: 'error getting item to ship', error: err, hostname: req.hostname});
     }
    
});

router.post("/", async (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     try {
          let item = await Item.getItemById(id);
          await item.ship(qty);
          res.redirect("/reports/items");
     } catch(err) {
          res.render('error', {message: 'unable to ship item ${item.name} ${item.itemClass} ${item.itemType}', error: err, hostname: req.hostname});        
     }
})

module.exports = router;
