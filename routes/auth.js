const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');

router.get('/login',  ctrl.mostrarLogin);
router.post('/login', ctrl.procesarLogin);
router.get('/logout', ctrl.cerrarSesion);

module.exports = router;
