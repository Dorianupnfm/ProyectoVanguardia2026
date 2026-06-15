// controllers/usuariosController.js — Solo Director
const Usuario = require('../models/Usuario');
const { ROL_LABELS } = require('../middleware/auth');

const listar = async (req, res) => {
  const usuarios = await Usuario.find().select('-password').sort({ nombre: 1 }).catch(() => []);
  res.render('usuarios/index', { titulo: 'Usuarios del Sistema', usuarios, ROL_LABELS });
};

const formNuevo = (req, res) =>
  res.render('usuarios/form', { titulo: 'Nuevo Usuario', usuario: {}, esEditar: false, ROL_LABELS });

const guardar = async (req, res) => {
  const { nombre, email, password, rol, estado } = req.body;
  const existe = await Usuario.findOne({ email: email.toLowerCase() });
  if (existe) {
    req.flash('error', 'Ese correo ya está registrado.');
    return res.redirect('/usuarios/nuevo');
  }
  await Usuario.create({ nombre, email, password, rol, estado: estado || 'activo' })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', `Usuario ${nombre} creado correctamente.`);
  res.redirect('/usuarios');
};

const formEditar = async (req, res) => {
  const usuario = await Usuario.findById(req.params.id).select('-password').catch(() => null);
  if (!usuario) { req.flash('error', 'Usuario no encontrado.'); return res.redirect('/usuarios'); }
  res.render('usuarios/form', { titulo: 'Editar Usuario', usuario, esEditar: true, ROL_LABELS });
};

const actualizar = async (req, res) => {
  const { nombre, email, rol, estado } = req.body;
  // No permitir desactivar la propia cuenta
  if (req.session.usuario.id.toString() === req.params.id && estado === 'inactivo') {
    req.flash('error', 'No puedes desactivar tu propia cuenta.');
    return res.redirect('/usuarios');
  }
  await Usuario.findByIdAndUpdate(req.params.id, {
    nombre, email: email.toLowerCase(), rol, estado,
    // Si se reactiva, limpiar bloqueo
    intentosFallidos: 0, bloqueadoHasta: null,
  }).catch(e => req.flash('error', e.message));
  req.flash('exito', 'Usuario actualizado.');
  res.redirect('/usuarios');
};

const eliminar = async (req, res) => {
  if (req.session.usuario.id.toString() === req.params.id) {
    req.flash('error', 'No puedes eliminar tu propia cuenta.');
    return res.redirect('/usuarios');
  }
  await Usuario.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Usuario eliminado.');
  res.redirect('/usuarios');
};

const formCambiarPassword = async (req, res) => {
  const usuario = await Usuario.findById(req.params.id).select('-password').catch(() => null);
  if (!usuario) { req.flash('error', 'Usuario no encontrado.'); return res.redirect('/usuarios'); }
  res.render('usuarios/cambiar-password', { titulo: 'Cambiar Contraseña', usuario });
};

const cambiarPassword = async (req, res) => {
  const { nuevaPassword, confirmar } = req.body;
  if (!nuevaPassword || nuevaPassword.length < 6) {
    req.flash('error', 'La contraseña debe tener al menos 6 caracteres.');
    return res.redirect('/usuarios/' + req.params.id + '/password');
  }
  if (nuevaPassword !== confirmar) {
    req.flash('error', 'Las contraseñas no coinciden.');
    return res.redirect('/usuarios/' + req.params.id + '/password');
  }
  try {
    const usuario = await Usuario.findById(req.params.id);
    usuario.password         = nuevaPassword;
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta   = null;
    await usuario.save();
    req.flash('exito', 'Contraseña actualizada correctamente.');
    res.redirect('/usuarios');
  } catch (e) {
    req.flash('error', 'Error al cambiar la contraseña.');
    res.redirect('/usuarios/' + req.params.id + '/password');
  }
};

// Desbloquear cuenta manualmente
const desbloquear = async (req, res) => {
  await Usuario.findByIdAndUpdate(req.params.id, {
    intentosFallidos: 0, bloqueadoHasta: null,
  });
  req.flash('exito', 'Cuenta desbloqueada correctamente.');
  res.redirect('/usuarios');
};

module.exports = {
  listar, formNuevo, guardar, formEditar, actualizar, eliminar,
  formCambiarPassword, cambiarPassword, desbloquear,
};
