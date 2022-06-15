var express = require('express');
var router = express.Router();
var Unit = require('../db/Unit');

/* GET categories listing. */
router.get('/', function(req, res, next) {
   Unit.getUnits( (rows) => {
       console.log(JSON.stringify(rows));
       res.render('units', {rows: rows});
   });
});


router.get('/add', (req, res, next) => {
    res.render('unit_form', {name: 'Add Unit'});
});

router.post('/', (req, res, next) => {
    console.log(req.body.unit);
    Unit.addUnit( { unit: req.body.unit}, (result) => {
         if( result instanceof Unit ) {
              // res.writeHead(200, {'Content-Type': 'text/html'});
              // res.write(`<div align="center"><h2><p>successfully added unit ${req.body.unit}</p></h2></div>`);
              // res.write(`<script>setTimeout(function() {window.location.href = "http://${req.hostname}:8080/units"; }, 2000);</script>`);
              // res.end();
              res.redirect("units");
         } else { 
              res.end(JSON.stringify(result));
         }
    });

});

module.exports = router;
