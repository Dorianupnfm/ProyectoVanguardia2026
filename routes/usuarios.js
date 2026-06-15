// routes/usuarios.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/usuariosController');
const { soloAutenticado, soloGestionUsuarios } = require('../middleware/auth');

router.use(soloAutenticado, soloGestionUsuarios);

router.get('/',              ctrl.listar);
router.get('/nuevo',         ctrl.formNuevo);
router.post('/',             ctrl.guardar);
router.get('/:id/editar',    ctrl.formEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);
router.get( '/:id/password',  ctrl.formCambiarPassword);
router.post('/:id/password',  ctrl.cambiarPassword);

router.post('/:id/desbloquear', ctrl.desbloquear);

module.exports = router;
