// middleware/auth.js
// Sistema de permisos por rol

// ── Roles y sus capacidades ────────────────────────────────────────
const PERMISOS = {
  // ¿Qué puede ver/hacer cada rol?
  director: {
    verTodo: true, editarTodo: true, eliminarTodo: true,
    usuarios: true, configuracion: true, reportes: true,
  },
  subdirector: {
    verTodo: true, editarTodo: true, eliminarTodo: false,
    usuarios: false, configuracion: false, reportes: true,
  },
  administrativo: {
    alumnos: true, docentes: true, matriculas: true,
    grados: true, secciones: true, carreras: true, asignaturas: true,
    usuarios: false, configuracion: false, reportes: true,
  },
  secretario: {
    alumnos: true, matriculas: true,
    docentes: 'ver', grados: 'ver', secciones: 'ver',
    usuarios: false, reportes: true,
  },
  consejero: {
    alumnos: 'ver', matriculas: 'ver',
    docentes: 'ver', reportes: true,
  },
  docente: {
    soloPropio: true,
  },
};

// ── Verificar si un rol tiene acceso a un módulo ───────────────────
const tieneAcceso = (rol, modulo, accion = 'ver') => {
  const p = PERMISOS[rol];
  if (!p) return false;
  if (p.verTodo)    return true;
  if (p.editarTodo && accion !== 'eliminar') return true;
  if (p[modulo] === true) return true;
  if (p[modulo] === 'ver' && accion === 'ver') return true;
  return false;
};

// ── Middleware: solo autenticado ───────────────────────────────────
const soloAutenticado = (req, res, next) => {
  if (req.session && req.session.usuarioId) return next();
  req.flash('error', 'Debes iniciar sesión para acceder.');
  res.redirect('/auth/login');
};

// ── Middleware: roles con acceso total (admin equivalente) ─────────
const soloAdmin = (req, res, next) => {
  const rolesAdmin = ['director','subdirector','administrativo'];
  if (req.session?.usuario && rolesAdmin.includes(req.session.usuario.rol)) return next();
  // Secretario también puede acceder a módulos básicos
  if (req.session?.usuario?.rol === 'secretario') return next();
  req.flash('error', 'No tienes permisos para acceder a esta sección.');
  res.redirect('/dashboard');
};

// ── Middleware: solo director o subdirector ────────────────────────
const soloDirectivo = (req, res, next) => {
  const roles = ['director','subdirector'];
  if (req.session?.usuario && roles.includes(req.session.usuario.rol)) return next();
  req.flash('error', 'Acceso restringido a directivos.');
  res.redirect('/dashboard');
};

// ── Middleware: solo gestión de usuarios (director) ────────────────
const soloGestionUsuarios = (req, res, next) => {
  if (req.session?.usuario?.rol === 'director') return next();
  req.flash('error', 'Solo el Director puede gestionar usuarios del sistema.');
  res.redirect('/dashboard');
};

// ── Middleware: pasar datos del usuario a las vistas ───────────────
const pasarUsuario = (req, res, next) => {
  res.locals.usuarioActual = req.session.usuario || null;
  res.locals.mensajesExito = req.flash('exito');
  res.locals.mensajesError = req.flash('error');
  res.locals.tieneAcceso   = tieneAcceso; // disponible en todas las vistas
  next();
};

// ── Helper: etiquetas legibles de roles ───────────────────────────
const ROL_LABELS = {
  director:      'Director',
  subdirector:   'Subdirector',
  administrativo:'Administrativo',
  secretario:    'Secretario',
  consejero:     'Consejero',
  docente:       'Docente',
};

module.exports = {
  soloAutenticado,
  soloAdmin,
  soloDirectivo,
  soloGestionUsuarios,
  pasarUsuario,
  tieneAcceso,
  ROL_LABELS,
  PERMISOS,
};
