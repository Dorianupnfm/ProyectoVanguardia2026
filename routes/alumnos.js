const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alumnosController');
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

// AJAX: secciones disponibles para un grado
const Grado   = require('../models/Grado');
const Seccion = require('../models/Seccion');

router.get('/api/secciones-por-grado/:gradoId', soloAutenticado, async (req, res) => {
  try {
    const secciones = await Seccion.find({ grado: req.params.gradoId, estado: 'activa' })
      .select('nombre jornada capacidad')
      .sort({ nombre: 1 });
    res.json(secciones);
  } catch (e) {
    res.json([]);
  }
});

// AJAX: siguiente número de expediente
router.get('/api/proximo-expediente', soloAutenticado, async (req, res) => {
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
