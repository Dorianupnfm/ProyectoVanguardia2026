// controllers/gradosController.js
const Grado      = require('../models/Grado');
const Carrera    = require('../models/Carrera');
const Seccion    = require('../models/Seccion');
const Asignatura = require('../models/Asignatura');
const Matricula  = require('../models/Matricula');

// ── Listar — agrupado por nivel ──────────────────────────────────────
const listar = async (req, res) => {
  const grados = await Grado.find().populate('carrera')
    .sort({ anioEscolar: -1, numero: 1, nombre: 1 }).catch(() => []);

  // Agrupar: Ciclo Básico / Bachillerato
  const cicloBasico   = grados.filter(g => g.nivel === 'ciclo-basico');
  const bachillerato  = grados.filter(g => g.nivel === 'bachillerato');

  res.render('grados/index', { titulo: 'Grados', grados, cicloBasico, bachillerato });
};

// ── Detalle completo del grado ───────────────────────────────────────
const ver = async (req, res) => {
  try {
    const grado = await Grado.findById(req.params.id).populate('carrera');
    if (!grado) { req.flash('error', 'Grado no encontrado.'); return res.redirect('/grados'); }

    // Secciones del grado
    const secciones = await Seccion.find({ grado: grado._id, estado: 'activa' })
      .populate('docente').sort({ nombre: 1 });

    // Asignaturas del grado con sus docentes
    const asignaturas = await Asignatura.find({ grado: grado._id, estado: 'activa' })
      .populate('docente').sort({ nombre: 1 });

    // Docentes únicos que imparten en este grado
    const docenteMap = {};
    asignaturas.forEach(a => {
      if (a.docente) docenteMap[a.docente._id] = a.docente;
    });
    secciones.forEach(s => {
      if (s.docente) docenteMap[s.docente._id] = s.docente;
    });
    const docentes = Object.values(docenteMap);

    // Alumnos matriculados en cualquier sección de este grado
    const seccionIds = secciones.map(s => s._id);
    const matriculas = await Matricula.find({
      seccion: { $in: seccionIds }, estado: 'activa',
    }).populate('alumno').populate('seccion')
      .sort({ 'alumno.apellido': 1 });

    res.render('grados/ver', {
      titulo:     `Grado: ${grado.nombre}`,
      grado,
      secciones,
      asignaturas,
      docentes,
      matriculas,
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar el detalle del grado.');
    res.redirect('/grados');
  }
};

// ── Formulario nuevo ─────────────────────────────────────────────────
const formNuevo = async (req, res) => {
  const carreras = await Carrera.find({ estado: 'activa' }).sort({ nombre: 1 });
  res.render('grados/form', { titulo: 'Nuevo Grado', grado: {}, carreras, esEditar: false });
};

// ── Guardar ──────────────────────────────────────────────────────────
const guardar = async (req, res) => {
  const { nombre, anioEscolar, carrera, estado } = req.body;
  const num   = parseInt(nombre);
  const nivel = !isNaN(num) && num <= 9 ? 'ciclo-basico' : 'bachillerato';

  await Grado.create({
    nombre, numero: isNaN(num) ? null : num,
    anioEscolar: +anioEscolar,
    nivel,
    carrera: nivel === 'bachillerato' ? (carrera || null) : null,
    estado: estado || 'activo',
  }).catch(e => req.flash('error', e.message));

  req.flash('exito', 'Grado registrado correctamente.');
  res.redirect('/grados');
};

// ── Formulario editar ────────────────────────────────────────────────
const formEditar = async (req, res) => {
  const [grado, carreras] = await Promise.all([
    Grado.findById(req.params.id).populate('carrera'),
    Carrera.find({ estado: 'activa' }).sort({ nombre: 1 }),
  ]).catch(() => [null, []]);
  if (!grado) { req.flash('error', 'Grado no encontrado.'); return res.redirect('/grados'); }
  res.render('grados/form', { titulo: 'Editar Grado', grado, carreras, esEditar: true });
};

// ── Actualizar ───────────────────────────────────────────────────────
const actualizar = async (req, res) => {
  const { nombre, anioEscolar, carrera, estado } = req.body;
  const num   = parseInt(nombre);
  const nivel = !isNaN(num) && num <= 9 ? 'ciclo-basico' : 'bachillerato';

  await Grado.findByIdAndUpdate(req.params.id, {
    nombre, numero: isNaN(num) ? null : num,
    anioEscolar: +anioEscolar,
    nivel,
    carrera: nivel === 'bachillerato' ? (carrera || null) : null,
    estado,
  }).catch(e => req.flash('error', e.message));

  req.flash('exito', 'Grado actualizado.');
  res.redirect('/grados');
};

// ── Eliminar ─────────────────────────────────────────────────────────
const eliminar = async (req, res) => {
  await Grado.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Grado eliminado.');
  res.redirect('/grados');
};

module.exports = { listar, ver, formNuevo, guardar, formEditar, actualizar, eliminar };
