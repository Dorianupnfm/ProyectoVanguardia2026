const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/padresController');
const { soloAutenticado, soloAdmin } = require('../middleware/auth');

router.use(soloAutenticado, soloAdmin);
router.get('/',              ctrl.listar);
router.get('/nuevo',         ctrl.formNuevo);
router.post('/',             ctrl.guardar);
router.get('/:id',           ctrl.ver);
router.get('/:id/editar',    ctrl.formEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);
router.post('/:id/generar-acceso', ctrl.generarAcceso);

module.exports = router;
