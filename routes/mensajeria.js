const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/mensajeriaController');
const { soloAutenticado } = require('../middleware/auth');
const upload  = require('../config/upload');

router.use(soloAutenticado);
router.get('/',              ctrl.bandeja);
router.get('/nueva',         ctrl.formNueva);
router.post('/nueva',        upload.single('adjunto'), ctrl.crearConversacion);
router.get('/:id',           ctrl.verConversacion);
router.post('/:id/enviar',   upload.single('adjunto'), ctrl.enviarMensaje);

module.exports = router;
