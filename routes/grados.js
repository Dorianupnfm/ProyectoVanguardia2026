const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/gradosController');
const { soloAutenticado, soloAdmin } = require('../middleware/auth');

router.use(soloAutenticado, soloAdmin);

router.get('/',              ctrl.listar);
router.get('/nuevo',         ctrl.formNuevo);
router.post('/',             ctrl.guardar);
router.get('/:id/ver',       ctrl.ver);
router.get('/:id/editar',    ctrl.formEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);

module.exports = router;
