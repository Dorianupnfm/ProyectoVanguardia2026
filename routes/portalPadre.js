const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/padrePortalController');
const { soloAutenticado } = require('../middleware/auth');

const soloPadre = (req, res, next) => {
  if (req.session.usuario?.rol === 'padre') return next();
  req.flash('error', 'Acceso restringido al portal de padres.');
  res.redirect('/dashboard');
};

router.use(soloAutenticado, soloPadre);
router.get('/',                  ctrl.dashboard);
router.get('/hijo/:id',          ctrl.verHijo);
router.get('/hijo/:id/notas',    ctrl.notasHijo);

module.exports = router;
