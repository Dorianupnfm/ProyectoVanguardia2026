const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alumnosController');
const { soloAutenticado } = require('../middleware/auth');

router.use(soloAutenticado);

// AJAX: siguiente número de expediente (usado por el botón "Generar" del formulario)
router.get('/api/proximo-expediente', async (req, res) => {
  try {
    const Alumno = require('../models/Alumno');
    const anio   = new Date().getFullYear();
    const count  = await Alumno.countDocuments();
    const next   = String(count + 1).padStart(4, '0');
    res.json({ expediente: `EXP-${anio}-${next}` });
  } catch (e) {
    res.json({ expediente: '' });
  }
});

router.get('/',              ctrl.listar);
router.get('/nuevo',         ctrl.mostrarFormNuevo);
router.post('/',             ctrl.guardar);
router.get('/:id',           ctrl.ver);
router.get('/:id/editar',    ctrl.mostrarFormEditar);
router.post('/:id',          ctrl.actualizar);
router.post('/:id/eliminar', ctrl.eliminar);

module.exports = router;
