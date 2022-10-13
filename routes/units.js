var express = require('express');
var router = express.Router();
var Unit = require('../db/Unit');

/* GET units listing. */
router.get('/', function(req, res, next) {
   Unit.getUnits( (err, units) => {
     if(err) {
         res.render('error', {message: 'error getting units', error: err, hostname: req.hostname});
     } else {
         res.render('units', {rows: units});
     }
   });
});


router.get('/add', (req, res, next) => {
    res.render('unit_form', {name: 'Add Unit'});
});

router.post('/', (req, res, next) => {
    let unit = new Unit(req.body);
    unit.insert(undefined,  (err, unit) => {
        if( err ) {
            res.render('error', {message: 'error inserting new unit', error: err, hostname: req.hostname});
        } else {
            res.redirect("/units");
        }
    })
});

module.exports = router;
