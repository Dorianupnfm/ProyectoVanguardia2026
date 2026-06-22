// controllers/notasController.js
const Parcial    = require('../models/Parcial');
const Actividad  = require('../models/Actividad');
const Nota       = require('../models/Nota');
const Asignatura = require('../models/Asignatura');
const Seccion    = require('../models/Seccion');
const Matricula  = require('../models/Matricula');
const { getDocente } = require('./docentePortalController');
const { COMPONENTES, COMPONENTE_NOMBRES, COMPONENTE_PESOS } = require('../models/Actividad');

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

    // Los 4 parciales del año existen siempre — se generan solos si faltan
    const [asignaturas, parciales] = await Promise.all([
      Asignatura.find(filtro).populate({ path: 'grado', populate: { path: 'carrera' } }).sort({ nombre: 1 }),
      Parcial.asegurarParcialesDelAnio(anio),
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
      Asignatura.findById(asignaturaId).populate('grado').populate('docente'),
      Seccion.findById(seccionId).populate('grado'),
      Parcial.findById(parcialId),
    ]);

    // Alumnos matriculados
    const matriculas = await Matricula.find({ seccion: seccionId, estado: 'activa' })
      .populate('alumno').sort({ 'alumno.apellido': 1 });

    // Actividades del parcial/asignatura/sección, agrupadas por componente
    const actividades = await Actividad.find({ asignatura: asignaturaId, parcial: parcialId, seccion: seccionId })
      .sort({ componente: 1, fecha: 1 });

    const actividadesPorComponente = {};
    COMPONENTES.forEach(c => { actividadesPorComponente[c] = actividades.filter(a => a.componente === c); });

    // Notas existentes
    const notasRaw = await Nota.find({ actividad: { $in: actividades.map(a => a._id) } });
    const notasMap = {};
    notasRaw.forEach(n => {
      const aid = n.alumno.toString();
      const vid = n.actividad.toString();
      if (!notasMap[aid]) notasMap[aid] = {};
      notasMap[aid][vid] = n;
    });

    // ── Calcular Nota Final ponderada por componente para cada alumno ──
    // Por cada componente: (suma obtenida / suma máxima posible) * peso del componente
    // Nota Final = suma de los aportes de los 5 componentes (sobre 100)
    const resumen = matriculas.map(m => {
      const aid = m.alumno._id.toString();
      const porComponente = {};
      let notaFinal = 0;

      COMPONENTES.forEach(comp => {
        const actsComp = actividadesPorComponente[comp];
        let obtenido = 0, maximo = 0;
        actsComp.forEach(act => {
          const n = notasMap[aid]?.[act._id.toString()];
          if (n !== undefined) obtenido += n.nota;
          maximo += act.puntajeMax;
        });
        const peso = COMPONENTE_PESOS[comp];
        // Si no hay actividades cargadas en el componente, su aporte es 0 (aún no evaluado)
        const aporte = maximo > 0 ? (obtenido / maximo) * peso : 0;
        porComponente[comp] = { obtenido, maximo, peso, aporte: Math.round(aporte * 10) / 10 };
        notaFinal += aporte;
      });

      notaFinal = Math.round(notaFinal * 10) / 10;
      return { alumno: m.alumno, porComponente, notaFinal };
    });

    res.render('notas/libro', {
      titulo:      'Notas — ' + asignatura.nombre,
      asignatura, seccion, parcial,
      matriculas, actividades, actividadesPorComponente, notasMap, resumen,
      COMPONENTES, COMPONENTE_NOMBRES, COMPONENTE_PESOS,
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

// ── AJAX: secciones por asignatura ───────────────────────────────────
const seccionesPorAsignatura = async (req, res) => {
  const asig = await Asignatura.findById(req.params.id);
  if (!asig) return res.json([]);
  const secciones = await Seccion.find({ grado: asig.grado, estado: 'activa' }).sort({ nombre: 1 });
  res.json(secciones);
};

// ── AJAX: recalcular nota final de un alumno (feedback en vivo) ──────
const recalcularNotaFinal = async (req, res) => {
  try {
    const { asignaturaId, parcialId, seccionId, alumnoId } = req.query;
    const actividades = await Actividad.find({ asignatura: asignaturaId, parcial: parcialId, seccion: seccionId });
    const notas = await Nota.find({ actividad: { $in: actividades.map(a => a._id) }, alumno: alumnoId });

    const notaPorActividad = {};
    notas.forEach(n => { notaPorActividad[n.actividad.toString()] = n.nota; });

    let notaFinal = 0;
    const detalle = {};
    COMPONENTES.forEach(comp => {
      const acts = actividades.filter(a => a.componente === comp);
      let obtenido = 0, maximo = 0;
      acts.forEach(a => {
        if (notaPorActividad[a._id.toString()] !== undefined) obtenido += notaPorActividad[a._id.toString()];
        maximo += a.puntajeMax;
      });
      const peso = COMPONENTE_PESOS[comp];
      const aporte = maximo > 0 ? (obtenido / maximo) * peso : 0;
      detalle[comp] = Math.round(aporte * 10) / 10;
      notaFinal += aporte;
    });

    res.json({ notaFinal: Math.round(notaFinal * 10) / 10, detalle });
  } catch (e) {
    res.json({ notaFinal: null, error: e.message });
  }
};

module.exports = {
  seleccionar, libro, guardarNotas,
  nuevaActividad, eliminarActividad,
  seccionesPorAsignatura, recalcularNotaFinal,
};
