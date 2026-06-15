const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/docentesController');
const { soloAutenticado } = require('../middleware/auth');

router.use(soloAutenticado);
router.get('/',              ctrl.listar);
router.get('/nuevo',         ctrl.mostrarFormNuevo);
router.post('/',             ctrl.guardar);
router.get('/:id',           ctrl.ver);
router.get('/:id/editar',    ctrl.mostrarFormEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);

module.exports = router;
