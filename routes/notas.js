const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notasController');
const { soloAutenticado } = require('../middleware/auth');

router.use(soloAutenticado);

router.get('/',                           ctrl.seleccionar);
router.get('/libro',                      ctrl.libro);
router.post('/guardar',                   ctrl.guardarNotas);
router.post('/actividad/nueva',           ctrl.nuevaActividad);
router.post('/actividad/:id/eliminar',    ctrl.eliminarActividad);
router.get('/api/secciones/:id',          ctrl.seccionesPorAsignatura);
router.get('/api/recalcular',             ctrl.recalcularNotaFinal);

module.exports = router;
