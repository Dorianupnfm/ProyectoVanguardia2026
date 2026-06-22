// controllers/reportesController.js
const Alumno     = require('../models/Alumno');
const Docente    = require('../models/Docente');
const Matricula  = require('../models/Matricula');
const Grado      = require('../models/Grado');
const Seccion    = require('../models/Seccion');
const Asignatura = require('../models/Asignatura');
const Parcial    = require('../models/Parcial');
const Actividad  = require('../models/Actividad');
const Nota       = require('../models/Nota');
const Asistencia = require('../models/Asistencia');
const { obtenerTodo } = require('./configuracionController');

// ── Hub de reportes ───────────────────────────────────────────────────
const hub = async (req, res) => {
  res.render('reportes/hub', { titulo: 'Reportes' });
};

// ── Boleta individual de un estudiante ────────────────────────────────
const boleta = async (req, res) => {
  try {
    const { alumnoId, parcialId, anio } = req.query;
    const anioEsc = parseInt(anio) || new Date().getFullYear();

    const [grados, parciales, cfg] = await Promise.all([
      Grado.find({ anioEscolar: anioEsc, estado: 'activo' }).sort({ numero: 1 }),
      Parcial.asegurarParcialesDelAnio(anioEsc),
      obtenerTodo(),
    ]);

    if (!alumnoId || !parcialId) {
      const alumnos = await Alumno.find({ estado: 'activo' }).sort({ apellido: 1 });
      return res.render('reportes/boleta-selector', {
        titulo: 'Boleta de Calificaciones', alumnos, parciales, grados, anioEsc, cfg,
      });
    }

    const [alumno, parcial, matricula] = await Promise.all([
      Alumno.findById(alumnoId),
      Parcial.findById(parcialId),
      Matricula.findOne({ alumno: alumnoId, anioEscolar: anioEsc, estado: 'activa' })
        .populate({ path: 'seccion', populate: [{ path: 'grado' }, { path: 'docente' }] }),
    ]);

    if (!alumno || !parcial) {
      req.flash('error', 'Alumno o parcial no encontrado.');
      return res.redirect('/reportes/boleta');
    }

    // Asignaturas de la sección
    let datos = [];
    if (matricula?.seccion) {
      const asignaturas = await Asignatura.find({ grado: matricula.seccion.grado._id, estado: 'activa' }).sort({ nombre: 1 });
      for (const asig of asignaturas) {
        const actividades = await Actividad.find({ asignatura: asig._id, parcial: parcialId, seccion: matricula.seccion._id });
        const actIds = actividades.map(a => a._id);
        const notas  = await Nota.find({ actividad: { $in: actIds }, alumno: alumnoId });
        const notasMap = {};
        notas.forEach(n => { notasMap[n.actividad.toString()] = n.nota; });
        const total   = notas.reduce((s, n) => s + n.nota, 0);
        const posible = actividades.reduce((s, a) => s + a.puntajeMax, 0);
        datos.push({ asignatura: asig, actividades, notasMap, total, posible,
          pct: posible > 0 ? Math.round(total / posible * 100) : null });
      }
    }

    const notaMinima = parseInt(cfg.nota_minima) || 60;

    res.render('reportes/boleta', {
      titulo: 'Boleta de Calificaciones', alumno, parcial, matricula, datos, notaMinima, cfg, anioEsc,
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al generar la boleta.');
    res.redirect('/reportes');
  }
};

// ── Padrón de estudiantes ─────────────────────────────────────────────
const padron = async (req, res) => {
  try {
    const anio     = parseInt(req.query.anio) || new Date().getFullYear();
    const gradoId  = req.query.gradoId  || '';
    const seccionId= req.query.seccionId || '';
    const estado   = req.query.estado   || '';

    const [grados, cfg] = await Promise.all([
      Grado.find({ anioEscolar: anio }).sort({ numero: 1 }),
      obtenerTodo(),
    ]);

    let seccionIds = [];
    if (seccionId) {
      seccionIds = [seccionId];
    } else if (gradoId) {
      const secciones = await Seccion.find({ grado: gradoId });
      seccionIds = secciones.map(s => s._id);
    }

    const filtroMat = { anioEscolar: anio };
    if (seccionIds.length) filtroMat.seccion = { $in: seccionIds };
    if (estado) filtroMat.estado = estado;

    const matriculasRaw = await Matricula.find(filtroMat)
      .populate('alumno')
      .populate({ path: 'seccion', populate: { path: 'grado' } });

    // Filtrar matrículas cuyo alumno haya sido eliminado (populate retorna null)
    const matriculas = matriculasRaw
      .filter(m => m.alumno)
      .sort((a, b) => (a.alumno.apellido||'').localeCompare(b.alumno.apellido||''));

    const secciones = gradoId ? await Seccion.find({ grado: gradoId }).sort({ nombre: 1 }) : [];

    res.render('reportes/padron', {
      titulo: 'Padrón de Estudiantes', matriculas, grados, secciones,
      anioEsc: anio, gradoId, seccionId, estado, cfg,
    });
  } catch (e) {
    console.error('Error en padrón:', e);
    req.flash('error', 'Error al generar el padrón.');
    res.redirect('/reportes');
  }
};

// ── Reporte de matrícula ──────────────────────────────────────────────
const reporteMatricula = async (req, res) => {
  try {
    const anio  = parseInt(req.query.anio) || new Date().getFullYear();
    const grados = await Grado.find({ anioEscolar: anio }).populate('carrera').sort({ numero: 1 });
    const cfg    = await obtenerTodo();

    const datos = await Promise.all(grados.map(async g => {
      const secciones = await Seccion.find({ grado: g._id });
      const total = await Matricula.countDocuments({
        seccion: { $in: secciones.map(s=>s._id) }, anioEscolar: anio
      });
      const activas = await Matricula.countDocuments({
        seccion: { $in: secciones.map(s=>s._id) }, anioEscolar: anio, estado: 'activa'
      });
      return { grado: g, secciones: secciones.length, total, activas };
    }));

    const totalGeneral  = datos.reduce((s,d)=>s+d.total,0);
    const activasGeneral= datos.reduce((s,d)=>s+d.activas,0);

    res.render('reportes/matricula', {
      titulo: 'Reporte de Matrículas', datos, anio, totalGeneral, activasGeneral, cfg,
    });
  } catch(e) {
    req.flash('error', 'Error al generar el reporte.');
    res.redirect('/reportes');
  }
};

// ── Reporte de asistencia por sección ────────────────────────────────
const reporteAsistencia = async (req, res) => {
  try {
    const { seccionId, asignaturaId, anio } = req.query;
    const anioEsc = parseInt(anio) || new Date().getFullYear();
    const [grados, cfg] = await Promise.all([
      Grado.find({ anioEscolar: anioEsc }).sort({ numero: 1 }),
      obtenerTodo(),
    ]);

    let registros = [], seccion = null, asignatura = null, secciones = [];

    if (seccionId) {
      seccion = await Seccion.findById(seccionId).populate('grado');
      secciones = seccion ? await Seccion.find({ grado: seccion.grado._id }) : [];
    }
    if (seccionId && asignaturaId) {
      asignatura = await Asignatura.findById(asignaturaId);
      registros  = await Asistencia.find({ seccion: seccionId, asignatura: asignaturaId })
        .populate({ path: 'detalle.alumno' }).sort({ fecha: -1 });
    }

    res.render('reportes/asistencia', {
      titulo: 'Reporte de Asistencia', registros, grados, secciones,
      seccion, asignatura, anioEsc, seccionId, asignaturaId, cfg,
    });
  } catch(e) {
    req.flash('error', 'Error al generar el reporte.');
    res.redirect('/reportes');
  }
};

// ── Carga docente ─────────────────────────────────────────────────────
const cargaDocente = async (req, res) => {
  try {
    const anio  = parseInt(req.query.anio) || new Date().getFullYear();
    const cfg   = await obtenerTodo();
    const docentes = await Docente.find({ estado: 'activo' }).sort({ apellido: 1 });

    const datos = await Promise.all(docentes.map(async d => {
      const asignaturas = await Asignatura.find({ docente: d._id, estado: 'activa' }).populate('grado');
      const secciones   = await Seccion.find({ docente: d._id, estado: 'activa' }).populate('grado');
      const horasTotales= asignaturas.reduce((s,a)=>s+a.horasSemana,0);
      return { docente: d, asignaturas, secciones, horasTotales };
    }));

    res.render('reportes/carga-docente', { titulo: 'Carga Docente', datos, anio, cfg });
  } catch(e) {
    req.flash('error', 'Error al generar el reporte.');
    res.redirect('/reportes');
  }
};

module.exports = { hub, boleta, padron, reporteMatricula, reporteAsistencia, cargaDocente };
