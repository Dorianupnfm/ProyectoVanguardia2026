// middleware/auth.js
const PERMISOS = {
  director:       { verTodo:true, editarTodo:true, eliminarTodo:true, usuarios:true, configuracion:true, reportes:true },
  subdirector:    { verTodo:true, editarTodo:true, eliminarTodo:false, usuarios:false, configuracion:false, reportes:true },
  administrativo: { alumnos:true, docentes:true, matriculas:true, grados:true, secciones:true, carreras:true, asignaturas:true, padres:true, usuarios:false, reportes:true },
  secretario:     { alumnos:true, matriculas:true, padres:true, docentes:'ver', grados:'ver', secciones:'ver', usuarios:false, reportes:true },
  consejero:      { alumnos:'ver', matriculas:'ver', docentes:'ver', reportes:true },
  docente:        { soloPropio:true },
  padre:          { soloHijos:true },
  estudiante:     { soloPropio:true },
};

const ROL_LABELS = {
  director:'Director', subdirector:'Subdirector', administrativo:'Administrativo',
  secretario:'Secretario', consejero:'Consejero', docente:'Docente',
  padre:'Padre de Familia', estudiante:'Estudiante',
};

const ROLES_ADMIN_BASE = ['director','subdirector','administrativo'];

const soloAutenticado = (req, res, next) => {
  if (req.session && req.session.usuarioId) return next();
  req.flash('error', 'Debes iniciar sesión para acceder.');
  res.redirect('/auth/login');
};

const soloAdmin = (req, res, next) => {
  const rol = req.session?.usuario?.rol;
  if (ROLES_ADMIN_BASE.includes(rol) || rol === 'secretario') return next();
  req.flash('error', 'No tienes permisos para acceder a esta sección.');
  res.redirect('/dashboard');
};

const soloDirectivo = (req, res, next) => {
  if (['director','subdirector'].includes(req.session?.usuario?.rol)) return next();
  req.flash('error', 'Acceso restringido a directivos.');
  res.redirect('/dashboard');
};

const soloGestionUsuarios = (req, res, next) => {
  if (['director', 'administrativo'].includes(req.session?.usuario?.rol)) return next();
  req.flash('error', 'Solo el Director o el Administrativo pueden gestionar usuarios del sistema.');
  res.redirect('/dashboard');
};

// Redirige según el rol a su "home" — usado tras login y en accesos cruzados
const homePorRol = (rol) => {
  if (rol === 'docente')    return '/docente';
  if (rol === 'padre')      return '/portal-padre';
  if (rol === 'estudiante') return '/portal-estudiante';
  return '/dashboard';
};

const pasarUsuario = (req, res, next) => {
  res.locals.usuarioActual = req.session.usuario || null;
  res.locals.mensajesExito = req.flash('exito');
  res.locals.mensajesError = req.flash('error');
  res.locals.ROL_LABELS    = ROL_LABELS;
  next();
};

module.exports = {
  soloAutenticado, soloAdmin, soloDirectivo, soloGestionUsuarios,
  pasarUsuario, ROL_LABELS, PERMISOS, homePorRol,
};
