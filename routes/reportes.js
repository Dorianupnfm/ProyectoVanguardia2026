const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportesController');
const { soloAutenticado } = require('../middleware/auth');

router.use(soloAutenticado);

router.get('/',            ctrl.hub);
router.get('/boleta',      ctrl.boleta);
router.get('/padron',      ctrl.padron);
router.get('/matricula',   ctrl.reporteMatricula);
router.get('/asistencia',  ctrl.reporteAsistencia);
router.get('/carga-docente', ctrl.cargaDocente);

module.exports = router;
