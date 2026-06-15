// controllers/notasController.js
const Parcial    = require('../models/Parcial');
const Actividad  = require('../models/Actividad');
const Nota       = require('../models/Nota');
const Asignatura = require('../models/Asignatura');
const Seccion    = require('../models/Seccion');
const Matricula  = require('../models/Matricula');
const { getDocente } = require('./docentePortalController');
const { COMPONENTES, COMPONENTE_NOMBRES } = require('../models/Actividad');

// ── Helpers ──────────────────────────────────────────────────────────
const getDocenteId = async (req) => {
  if (req.session.usuario.rol === 'docente') {
    const d = await getDocente(req.session.usuarioId);
    return d ? d._id : null;
  }
  return null; // admin puede ver todo
};

// ── Panel de notas — seleccionar asignatura/sección/parcial ──────────
const seleccionar = async (req, res) => {
  try {
    const docenteId = await getDocenteId(req);
    const anio      = parseInt(req.query.anio) || new Date().getFullYear();
    const filtro    = docenteId ? { docente: docenteId, estado: 'activa' } : { estado: 'activa' };

    const [asignaturas, parciales] = await Promise.all([
      Asignatura.find(filtro).populate('grado').sort({ nombre: 1 }),
      Parcial.find({ anioEscolar: anio }).sort({ numero: 1 }),
    ]);

    let secciones = [];
    if (req.query.asignaturaId) {
      const asig = await Asignatura.findById(req.query.asignaturaId);
      if (asig) secciones = await Seccion.find({ grado: asig.grado, estado: 'activa' }).sort({ nombre: 1 });
    }

    res.render('notas/seleccionar', {
      titulo: 'Registro de Notas',
      asignaturas, parciales, secciones, anio,
      asignaturaId: req.query.asignaturaId || '',
      seccionId:    req.query.seccionId    || '',
      parcialId:    req.query.parcialId    || '',
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar el módulo de notas.');
    res.redirect('/dashboard');
  }
};

// ── Libro de notas — actividades y calificaciones ────────────────────
const libro = async (req, res) => {
  try {
    const { asignaturaId, seccionId, parcialId } = req.query;
    if (!asignaturaId || !seccionId || !parcialId) {
      req.flash('error', 'Selecciona asignatura, sección y parcial.');
      return res.redirect('/notas');
    }

    const [asignatura, seccion, parcial] = await Promise.all([
      Asignatura.findById(asignaturaId).populate('grado'),
      Seccion.findById(seccionId).populate('grado'),
      Parcial.findById(parcialId),
    ]);

    // Alumnos matriculados
    const matriculas = await Matricula.find({ seccion: seccionId, estado: 'activa' })
      .populate('alumno').sort({ 'alumno.apellido': 1 });

    // Actividades del parcial/asignatura/sección
    const actividades = await Actividad.find({ asignatura: asignaturaId, parcial: parcialId, seccion: seccionId })
      .sort({ componente: 1, fecha: 1 });

    // Notas existentes
    const notasRaw = await Nota.find({
      actividad: { $in: actividades.map(a => a._id) }
    });

    // Organizar notas en mapa {alumnoId: {actividadId: nota}}
    const notasMap = {};
    notasRaw.forEach(n => {
      const aid = n.alumno.toString();
      const vid = n.actividad.toString();
      if (!notasMap[aid]) notasMap[aid] = {};
      notasMap[aid][vid] = n;
    });

    // Calcular totales por alumno
    const resumen = matriculas.map(m => {
      const aid = m.alumno._id.toString();
      let total = 0, posible = 0;
      actividades.forEach(act => {
        const n = notasMap[aid]?.[act._id.toString()];
        if (n !== undefined) total  += n.nota;
        posible += act.puntajeMax;
      });
      const pct = posible > 0 ? Math.round(total / posible * 100) : null;
      return { alumno: m.alumno, total, posible, pct };
    });

    res.render('notas/libro', {
      titulo:      'Libro de Notas',
      asignatura, seccion, parcial,
      matriculas, actividades, notasMap, resumen,
      COMPONENTES, COMPONENTE_NOMBRES,
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar el libro de notas.');
    res.redirect('/notas');
  }
};

// ── Guardar notas (POST masivo) ──────────────────────────────────────
const guardarNotas = async (req, res) => {
  try {
    const { asignaturaId, seccionId, parcialId } = req.body;

    // req.body tiene campos: nota_ALUMNO_ACTIVIDAD
    const ops = [];
    Object.entries(req.body).forEach(([key, val]) => {
      if (!key.startsWith('nota_')) return;
      const partes      = key.replace('nota_','').split('_');
      const alumnoId    = partes[0];
      const actividadId = partes[1];
      const nota        = parseFloat(val);
      if (isNaN(nota) || nota < 0) return;

      ops.push({
        updateOne: {
          filter: { actividad: actividadId, alumno: alumnoId },
          update: { $set: { nota } },
          upsert: true,
        }
      });
    });

    if (ops.length) await Nota.bulkWrite(ops);

    req.flash('exito', `${ops.length} nota(s) guardada(s) correctamente.`);
    res.redirect('/notas/libro?' + new URLSearchParams({ asignaturaId, seccionId, parcialId }));
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar las notas.');
    res.redirect('/notas');
  }
};

// ── CRUD de actividades ──────────────────────────────────────────────
const nuevaActividad = async (req, res) => {
  const { nombre, componente, asignaturaId, parcialId, seccionId, puntajeMax, fecha, descripcion } = req.body;
  try {
    await Actividad.create({ nombre, componente, asignatura: asignaturaId, parcial: parcialId,
      seccion: seccionId, puntajeMax: +puntajeMax || 10, fecha: fecha || Date.now(), descripcion });
    req.flash('exito', `Actividad "${nombre}" creada.`);
  } catch (e) { req.flash('error', 'Error al crear la actividad: ' + e.message); }
  res.redirect('/notas/libro?' + new URLSearchParams({ asignaturaId, seccionId, parcialId }));
};

const eliminarActividad = async (req, res) => {
  const { asignaturaId, seccionId, parcialId } = req.body;
  const tieneNotas = await Nota.countDocuments({ actividad: req.params.id });
  if (tieneNotas > 0) {
    req.flash('error', 'Esta actividad tiene notas registradas. Elimina las notas primero.');
    return res.redirect('/notas/libro?' + new URLSearchParams({ asignaturaId, seccionId, parcialId }));
  }
  await Actividad.findByIdAndDelete(req.params.id);
  req.flash('exito', 'Actividad eliminada.');
  res.redirect('/notas/libro?' + new URLSearchParams({ asignaturaId, seccionId, parcialId }));
};

// ── CRUD de parciales ─────────────────────────────────────────────────
const listarParciales = async (req, res) => {
  const parciales = await Parcial.find().sort({ anioEscolar: -1, numero: 1 });
  res.render('notas/parciales', { titulo: 'Parciales', parciales });
};

const guardarParcial = async (req, res) => {
  const { nombre, numero, anioEscolar, fechaInicio, fechaFin, estado } = req.body;
  await Parcial.create({ nombre, numero: +numero, anioEscolar: +anioEscolar,
    fechaInicio: fechaInicio||null, fechaFin: fechaFin||null, estado: estado||'pendiente' })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Parcial creado.');
  res.redirect('/notas/parciales');
};

const actualizarParcial = async (req, res) => {
  const { nombre, numero, anioEscolar, fechaInicio, fechaFin, estado } = req.body;
  await Parcial.findByIdAndUpdate(req.params.id,
    { nombre, numero: +numero, anioEscolar: +anioEscolar,
      fechaInicio: fechaInicio||null, fechaFin: fechaFin||null, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Parcial actualizado.');
  res.redirect('/notas/parciales');
};

const eliminarParcial = async (req, res) => {
  const tieneActividades = await Actividad.countDocuments({ parcial: req.params.id });
  if (tieneActividades) {
    req.flash('error', 'Este parcial tiene actividades. Elimínalas primero.');
    return res.redirect('/notas/parciales');
  }
  await Parcial.findByIdAndDelete(req.params.id);
  req.flash('exito', 'Parcial eliminado.');
  res.redirect('/notas/parciales');
};

// ── AJAX: secciones por asignatura ───────────────────────────────────
const seccionesPorAsignatura = async (req, res) => {
  const asig = await Asignatura.findById(req.params.id);
  if (!asig) return res.json([]);
  const secciones = await Seccion.find({ grado: asig.grado, estado: 'activa' }).sort({ nombre: 1 });
  res.json(secciones);
};

module.exports = {
  seleccionar, libro, guardarNotas,
  nuevaActividad, eliminarActividad,
  listarParciales, guardarParcial, actualizarParcial, eliminarParcial,
  seccionesPorAsignatura,
};
