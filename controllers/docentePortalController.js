// controllers/docentePortalController.js
// Vista personalizada para el rol docente

const Docente     = require('../models/Docente');
const Asignatura  = require('../models/Asignatura');
const Seccion     = require('../models/Seccion');
const Matricula   = require('../models/Matricula');
const Asistencia  = require('../models/Asistencia');

// ── Obtener el registro Docente vinculado al usuario en sesión ────────
const getDocente = async (usuarioId) => {
  return Docente.findOne({ usuario: usuarioId });
};

// ── Dashboard del docente ─────────────────────────────────────────────
const dashboard = async (req, res) => {
  try {
    const docente = await getDocente(req.session.usuarioId);
    if (!docente) {
      req.flash('error', 'Tu usuario no está vinculado a un registro de docente. Contacta al administrador.');
      return res.render('docente/sin-vincular', { titulo: 'Portal Docente' });
    }

    const [asignaturas, secciones] = await Promise.all([
      Asignatura.find({ docente: docente._id, estado: 'activa' }).populate('grado'),
      Seccion.find({ docente: docente._id, estado: 'activa' }).populate('grado'),
    ]);

    // Contar alumnos únicos en sus secciones
    const seccionIds = secciones.map(s => s._id);
    const totalAlumnos = await Matricula.countDocuments({
      seccion: { $in: seccionIds }, estado: 'activa',
    });

    // Últimas 5 asistencias registradas
    const ultimasAsistencias = await Asistencia.find({ docente: docente._id })
      .populate('asignatura').populate('seccion')
      .sort({ fecha: -1 }).limit(5);

    res.render('docente/dashboard', {
      titulo:    'Mi Portal',
      docente,
      asignaturas,
      secciones,
      totalAlumnos,
      ultimasAsistencias,
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar el portal.');
    res.redirect('/');
  }
};

// ── Mis alumnos (de todas sus secciones) ─────────────────────────────
const misAlumnos = async (req, res) => {
  try {
    const docente    = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const seccionId  = req.query.seccion || null;
    const secciones  = await Seccion.find({ docente: docente._id, estado: 'activa' }).populate('grado');
    const seccionIds = seccionId ? [seccionId] : secciones.map(s => s._id);

    const matriculas = await Matricula.find({
      seccion: { $in: seccionIds }, estado: 'activa',
    }).populate('alumno').populate({ path: 'seccion', populate: { path: 'grado' } })
      .sort({ 'alumno.apellido': 1 });

    res.render('docente/mis-alumnos', {
      titulo:    'Mis Alumnos',
      matriculas,
      secciones,
      seccionActual: seccionId,
    });
  } catch (e) {
    req.flash('error', 'Error al cargar los alumnos.');
    res.redirect('/docente');
  }
};

// ── Mis asignaturas ───────────────────────────────────────────────────
const misAsignaturas = async (req, res) => {
  try {
    const docente    = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const asignaturas = await Asignatura.find({ docente: docente._id })
      .populate('grado').sort({ nombre: 1 });

    res.render('docente/mis-asignaturas', { titulo: 'Mis Asignaturas', asignaturas });
  } catch (e) {
    req.flash('error', 'Error al cargar asignaturas.');
    res.redirect('/docente');
  }
};

// ── Historial de asistencias ──────────────────────────────────────────
const historialAsistencia = async (req, res) => {
  try {
    const docente = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const registros = await Asistencia.find({ docente: docente._id })
      .populate('asignatura').populate('seccion')
      .sort({ fecha: -1 }).limit(50);

    res.render('docente/historial-asistencia', { titulo: 'Historial de Asistencia', registros });
  } catch (e) {
    req.flash('error', 'Error al cargar el historial.');
    res.redirect('/docente');
  }
};

module.exports = { dashboard, misAlumnos, misAsignaturas, historialAsistencia, getDocente };
