import express from 'express'
const router = express.Router();
import Item from '../db/Item.js'

router.get('/', (req, res, next) => {
     let id = Number(req.query.id);
     let classValuesPromise = Item.getClassValues();
     let itemPromise = Item.getItemById(id);
     Promise.all([itemPromise, classValuesPromise])
     .then( ([item, classValues]) => {
          res.render('transfer_form', {hostname: req.hostname, item: item, itemClasses: classValues.filter( (e) => {return e != item.itemClass})});
     })
     .catch( (err) => {
          res.render('error', {message: 'error getting data for transfer form', error: err, hostname: req.hostname} );
     })
 })

 router.post("/", async (req, res, next) => {
     let id = Number(req.body.id);
     let qty = Number(req.body.qty);
     let toClass = req.body.toClass;
     try {
          let item =  await Item.getItemById(id);
          let toItem =  await Item.findByNameAndClassAndType(item.name,toClass,item.itemType);
          await item.transfer(toItem,qty);
          res.redirect("/reports/items");
     } catch(err) {
          res.render('error', {message: 'error transferring item', error: err, hostname: req.hostname});
     }
})

export default router;