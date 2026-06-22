// routes/docente.js  — portal exclusivo para rol docente
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/docentePortalController');
const { soloAutenticado } = require('../middleware/auth');

// Middleware: solo docentes
const soloDocente = (req, res, next) => {
  if (!req.session.usuarioId) return res.redirect('/auth/login');
  if (req.session.usuario?.rol === 'docente') return next();
  req.flash('error', 'Acceso restringido al portal docente.');
  res.redirect('/dashboard');
};

router.use(soloAutenticado, soloDocente);

router.get('/',              ctrl.dashboard);
router.get('/mis-alumnos',   ctrl.misAlumnos);
router.get('/mis-asignaturas', ctrl.misAsignaturas);
router.get('/historial',     ctrl.historialAsistencia);

module.exports = router;
