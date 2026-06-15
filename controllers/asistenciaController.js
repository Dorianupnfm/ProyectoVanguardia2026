// controllers/asistenciaController.js
// Módulo de pase de asistencia

const Asistencia = require('../models/Asistencia');
const Asignatura = require('../models/Asignatura');
const Seccion    = require('../models/Seccion');
const Matricula  = require('../models/Matricula');
const { getDocente } = require('./docentePortalController');

// ── Formulario: seleccionar asignatura y fecha ─────────────────────────
const formNueva = async (req, res) => {
  try {
    const docente = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const asignaturas = await Asignatura.find({ docente: docente._id, estado: 'activa' })
      .populate('grado').sort({ nombre: 1 });

    // Secciones del grado de la asignatura pre-seleccionada
    const asignaturaId = req.query.asignatura || null;
    let secciones = [];
    if (asignaturaId) {
      const asig = await Asignatura.findById(asignaturaId);
      if (asig) {
        secciones = await Seccion.find({ grado: asig.grado, estado: 'activa' });
      }
    }

    res.render('asistencia/seleccionar', {
      titulo:        'Pasar Asistencia',
      asignaturas,
      secciones,
      asignaturaId,
      hoy:           new Date().toISOString().split('T')[0],
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar el formulario.');
    res.redirect('/docente');
  }
};

// ── AJAX: secciones por asignatura ────────────────────────────────────
const seccionesPorAsignatura = async (req, res) => {
  try {
    const asig = await Asignatura.findById(req.params.id);
    if (!asig) return res.json([]);
    const secciones = await Seccion.find({ grado: asig.grado, estado: 'activa' }).sort({ nombre: 1 });
    res.json(secciones);
  } catch (e) {
    res.json([]);
  }
};

// ── Cargar alumnos para pasar asistencia ─────────────────────────────
const cargarLista = async (req, res) => {
  try {
    const docente = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const { asignaturaId, seccionId, fecha } = req.query;
    if (!asignaturaId || !seccionId || !fecha) {
      req.flash('error', 'Selecciona asignatura, sección y fecha.');
      return res.redirect('/asistencia/nueva');
    }

    const [asignatura, seccion] = await Promise.all([
      Asignatura.findById(asignaturaId).populate('grado'),
      Seccion.findById(seccionId).populate('grado'),
    ]);

    // Alumnos matriculados en esa sección
    const matriculas = await Matricula.find({
      seccion: seccionId, estado: 'activa',
    }).populate('alumno').sort({ 'alumno.apellido': 1 });

    if (!matriculas.length) {
      req.flash('error', 'No hay alumnos matriculados en esta sección.');
      return res.redirect('/asistencia/nueva');
    }

    // Verificar si ya existe registro para ese día
    const fechaDate = new Date(fecha + 'T12:00:00');
    const yaExiste  = await Asistencia.findOne({
      asignatura: asignaturaId, seccion: seccionId,
      fecha: { $gte: new Date(fecha + 'T00:00:00'), $lte: new Date(fecha + 'T23:59:59') },
    });

    res.render('asistencia/lista', {
      titulo:      'Pasar Asistencia',
      asignatura,
      seccion,
      fecha,
      fechaDate,
      matriculas,
      asistenciaExistente: yaExiste,
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar la lista.');
    res.redirect('/asistencia/nueva');
  }
};

// ── Guardar asistencia ────────────────────────────────────────────────
const guardar = async (req, res) => {
  try {
    const docente = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const { asignaturaId, seccionId, fecha, tema, comentarioGeneral } = req.body;

    // Construir el detalle — req.body tiene campos: estado_ALUMNO_ID y comentario_ALUMNO_ID
    const matriculas = await Matricula.find({
      seccion: seccionId, estado: 'activa',
    }).populate('alumno');

    const detalle = matriculas.map(m => ({
      alumno:     m.alumno._id,
      estado:     req.body['estado_' + m.alumno._id] || 'presente',
      comentario: req.body['comentario_' + m.alumno._id] || '',
    }));

    const fechaDate = new Date(fecha + 'T12:00:00');

    // Upsert: si ya existe actualizar, si no crear
    await Asistencia.findOneAndUpdate(
      {
        asignatura: asignaturaId, seccion: seccionId,
        fecha: { $gte: new Date(fecha + 'T00:00:00'), $lte: new Date(fecha + 'T23:59:59') },
      },
      { asignatura: asignaturaId, seccion: seccionId, docente: docente._id,
        fecha: fechaDate, tema, comentarioGeneral, detalle },
      { upsert: true, new: true }
    );

    const ausentes = detalle.filter(d => d.estado !== 'presente').length;
    req.flash('exito', `Asistencia guardada. ${detalle.length - ausentes} presentes, ${ausentes} con otro estado.`);
    res.redirect('/asistencia/historial');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar la asistencia.');
    res.redirect('/asistencia/nueva');
  }
};

// ── Historial ─────────────────────────────────────────────────────────
const historial = async (req, res) => {
  try {
    const docente  = await getDocente(req.session.usuarioId);
    if (!docente) return res.redirect('/docente');

    const registros = await Asistencia.find({ docente: docente._id })
      .populate('asignatura').populate('seccion')
      .sort({ fecha: -1 }).limit(60);

    res.render('asistencia/historial', { titulo: 'Historial de Asistencia', registros });
  } catch (e) {
    req.flash('error', 'Error al cargar el historial.');
    res.redirect('/docente');
  }
};

// ── Ver detalle de una sesión ─────────────────────────────────────────
const ver = async (req, res) => {
  try {
    const registro = await Asistencia.findById(req.params.id)
      .populate('asignatura').populate('seccion')
      .populate({ path: 'detalle.alumno' });

    if (!registro) { req.flash('error', 'Registro no encontrado.'); return res.redirect('/asistencia/historial'); }
    res.render('asistencia/ver', { titulo: 'Detalle de Asistencia', registro });
  } catch (e) {
    req.flash('error', 'Error al cargar el registro.');
    res.redirect('/asistencia/historial');
  }
};

module.exports = { formNueva, seccionesPorAsignatura, cargarLista, guardar, historial, ver };
