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
router.get('/parciales',                  ctrl.listarParciales);
router.post('/parciales',                 ctrl.guardarParcial);
router.post('/parciales/:id',             ctrl.actualizarParcial);
router.post('/parciales/:id/eliminar',    ctrl.eliminarParcial);
router.get('/api/secciones/:id',          ctrl.seccionesPorAsignatura);

module.exports = router;
