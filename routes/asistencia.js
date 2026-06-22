// routes/asistencia.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/asistenciaController');
const { soloAutenticado } = require('../middleware/auth');

router.use(soloAutenticado);

router.get('/nueva',                          ctrl.formNueva);
router.get('/lista',                          ctrl.cargarLista);
router.post('/guardar',                       ctrl.guardar);
router.get('/historial',                      ctrl.historial);
router.get('/ver/:id',                        ctrl.ver);
router.get('/api/secciones/:id',              ctrl.seccionesPorAsignatura);

module.exports = router;
