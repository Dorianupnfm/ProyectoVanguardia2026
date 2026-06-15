// routes/secciones.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/seccionesController');
const { soloAutenticado, soloAdmin } = require('../middleware/auth');

router.use(soloAutenticado, soloAdmin);

router.get('/',               ctrl.listar);
router.get('/nuevo',          ctrl.formNueva);
router.post('/',              ctrl.guardar);
router.get('/:id/editar',     ctrl.formEditar);
router.post('/:id',           ctrl.actualizar);
router.post('/:id/eliminar',  ctrl.eliminar);

module.exports = router;
