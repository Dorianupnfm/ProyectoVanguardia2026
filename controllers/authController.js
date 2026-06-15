// controllers/authController.js
const Usuario = require('../models/Usuario');

const MAX_INTENTOS  = 5;
const BLOQUEO_MIN   = 15; // minutos de bloqueo

const mostrarLogin = (req, res) => {
  if (req.session.usuarioId) return res.redirect('/dashboard');
  res.render('auth/login', { titulo: 'Iniciar Sesión' });
};

const procesarLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Ingresa correo y contraseña.');
    return res.redirect('/auth/login');
  }

  try {
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });

    if (!usuario) {
      req.flash('error', 'Correo o contraseña incorrectos.');
      return res.redirect('/auth/login');
    }

    // Verificar si está inactivo
    if (usuario.estado === 'inactivo') {
      req.flash('error', 'Tu cuenta está inactiva. Contacta al administrador.');
      return res.redirect('/auth/login');
    }

    // Verificar bloqueo por intentos fallidos
    if (usuario.estaBloqueado()) {
      const min = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      req.flash('error', `Cuenta bloqueada por intentos fallidos. Intenta en ${min} minuto(s).`);
      return res.redirect('/auth/login');
    }

    // Verificar contraseña
    const correcta = await usuario.compararPassword(password);
    if (!correcta) {
      usuario.intentosFallidos += 1;
      if (usuario.intentosFallidos >= MAX_INTENTOS) {
        usuario.bloqueadoHasta = new Date(Date.now() + BLOQUEO_MIN * 60 * 1000);
        usuario.intentosFallidos = 0;
        await usuario.save();
        req.flash('error', `Cuenta bloqueada por ${MAX_INTENTOS} intentos fallidos. Espera ${BLOQUEO_MIN} minutos.`);
      } else {
        await usuario.save();
        const restantes = MAX_INTENTOS - usuario.intentosFallidos;
        req.flash('error', `Contraseña incorrecta. ${restantes} intento(s) restantes antes del bloqueo.`);
      }
      return res.redirect('/auth/login');
    }

    // Login exitoso — resetear intentos
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta   = null;
    await usuario.save();

    req.session.usuarioId = usuario._id;
    req.session.usuario   = {
      id:     usuario._id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol,
    };

    req.flash('exito', `Bienvenido, ${usuario.nombre}`);
    res.redirect('/dashboard');

  } catch (e) {
    console.error(e);
    req.flash('error', 'Error interno. Intenta de nuevo.');
    res.redirect('/auth/login');
  }
};

const cerrarSesion = (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
};

module.exports = { mostrarLogin, procesarLogin, cerrarSesion };
