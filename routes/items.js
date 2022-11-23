import express from 'express'
const router = express.Router();
import Item from '../db/Item.js'
import Category from '../db/Category.js'
import Unit from '../db/Unit.js'

router.get('/add', (req, res, next) => {
    let categoriesPromise = Category.getCategories();
    let unitsPromise = Unit.getUnits();
    let classValuesPromise = Item.getClassValues();
    let typeValuesPromise = Item.getTypeValues();
    Promise.all([categoriesPromise, unitsPromise, classValuesPromise, typeValuesPromise])
    .then( ([categories, units, classValues, typeValues]) => {
        res.render('item_form', {hostname: req.hostname, name: 'Add Item', itemClasses: classValues, itemTypes: typeValues, categories: categories, units: units, item: {}, messages: [] });
    })
    .catch( (err) => {
        res.render('error', {message: 'error getting data for adding item', error: err, hostname: req.hostname});      
    })
});

router.get('/update', (req, res, next) => {
    let id = Number(req.query.id);
    let categoriesPromise = Category.getCategories();
    let unitsPromise = Unit.getUnits();
    let classValuesPromise = Item.getClassValues();
    let typeValuesPromise = Item.getTypeValues();
    let itemPromise = Item.getItemById(id);
    Promise.all([categoriesPromise, unitsPromise, classValuesPromise, typeValuesPromise, itemPromise])
    .then( ([categories, units, classValues, typeValues, item]) => {
        res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemClasses: classValues, itemTypes: typeValues, item: item, categories: categories, units: units, messages: [] });
    })
    .catch( (err) => {
        res.render('error', {message: 'error getting data for updating item', error: err, hostname: req.hostname});
    })
});


router.get('/delete', (req, res, next) => {
    let id = Number(req.query.id);
    Item.deleteItem(id)
    .then( (result) => {
        res.redirect('/reports/items');
    })
    .catch( (err) => {
        res.render('error', {message: 'error deleting item', error: err, hostname: req.hostname}); 
    })
});


router.post('/', (req, res, next) => {
    let item = new Item(req.body);
    if( item.id ) {
        item.update()
        .then( (_) => {
            res.redirect('/reports/items'); 
        })
        .catch( (err) => {
            let categoriesPromise = Category.getCategories();
            let unitsPromise = Unit.getUnits();
            let classValuesPromise = Item.getClassValues();
            let typeValuesPromise = Item.getTypeValues();
            Promise.all([categoriesPromise, unitsPromise, classValuesPromise, typeValuesPromise])
            .then( ([categories, units, classValues, typeValues]) => {
                res.render('item_update_form', {hostname: req.hostname, name: `Update ${item.itemClass} ${item.itemType} ${item.name}`, itemTypes: typeValues, itemClasses: classValues, categories: categories, units: units, item: item, messages: err.messages});
            })
            .catch( (err) => {
                res.render('error', {message: 'error getting data to update item', error: err, hostname: req.hostname});           
            })
        })
    } else {
        item.insert()
        .then( (_) => {
            res.redirect("/reports/items");
        })
        .catch( (err) => {
            let categoriesPromise = Category.getCategories();
            let unitsPromise = Unit.getUnits();
            let classValuesPromise = Item.getClassValues();
            let typeValuesPromise = Item.getTypeValues();
            Promise.all([categoriesPromise, unitsPromise, classValuesPromise, typeValuesPromise])
            .then( ([categories, units, classValues, typeValues]) => {
                res.render('item_form', {hostname: req.hostname, name: 'Add Item',itemTypes: typeValues, itemClasses: classValues, categories: categories, units: units, item: item, messages: err.messages});
            })
            .catch( (err) => {
                res.render('error', {message: 'error getting item type values', error: err, hostname: req.hostname});        
            })
        }) 
    }
});

export default router;