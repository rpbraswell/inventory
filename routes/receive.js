import express from 'express'
const router = express.Router();
import Item from '../db/Item.js'

router.get("/", async (req, res, next) => {
     let id = Number(req.query.id);
     try {
          let item = await Item.getItemById(id);
          res.render('receiving_form', {item: item});    
     } catch(err) {
          res.render('error', {message: 'error getting item to receive', error: err, hostname: req.hostname});          
     }
});

router.post("/", async (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     try {
          let item = await Item.getItemById(id);
          await item.receive(qty);
          res.redirect("/reports/items");
     } catch(err) {
          res.render('error', {message: 'unable to receive item', error: err, hostname: req.hostname});
     }
});

export default router;
