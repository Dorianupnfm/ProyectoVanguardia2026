// routes/matriculas.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/matriculasController');
const { soloAutenticado, soloAdmin } = require('../middleware/auth');

router.use(soloAutenticado, soloAdmin);

router.get('/',              ctrl.listar);
router.get('/nueva',         ctrl.formNueva);
router.post('/',             ctrl.guardar);
router.get('/:id',           ctrl.ver);
router.get('/:id/editar',    ctrl.formEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);

module.exports = router;
