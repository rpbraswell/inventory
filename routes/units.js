import express from 'express'
const router = express.Router();
import Unit from '../db/Unit.js'

/* GET units listing. */
router.get('/', async function(req, res, next) {
   try {
      let units = await Unit.getUnits();
      res.render('units', {rows: units});
   } catch(err) {
       res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
   }
});

router.get('/add', (req, res, next) => {
    res.render('unit_form', {name: 'Add Unit'});
});

router.post('/', async (req, res, next) => {
    let unit = new Unit(req.body);
    try {
        await unit.insert();
        res.redirect("/units");
    } catch(err) {
        res.render('error', {message: 'error inserting new unit', error: err, hostname: req.hostname});
    }
});

export default router;