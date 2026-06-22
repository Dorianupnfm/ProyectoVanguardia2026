const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/configuracionController');
const { soloAutenticado, soloDirectivo } = require('../middleware/auth');

router.use(soloAutenticado, soloDirectivo);
router.get('/',        ctrl.mostrar);
router.post('/guardar', ctrl.guardar);

module.exports = router;
