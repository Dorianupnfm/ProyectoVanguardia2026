const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/estudiantePortalController');
const { soloAutenticado } = require('../middleware/auth');

const soloEstudiante = (req, res, next) => {
  if (req.session.usuario?.rol === 'estudiante') return next();
  req.flash('error', 'Acceso restringido al portal del estudiante.');
  res.redirect('/dashboard');
};

router.use(soloAutenticado, soloEstudiante);
router.get('/',              ctrl.dashboard);
router.get('/notas',         ctrl.misNotas);
router.get('/asistencia',    ctrl.miAsistencia);

module.exports = router;
