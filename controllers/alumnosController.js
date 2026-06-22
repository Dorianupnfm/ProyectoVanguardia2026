// controllers/alumnosController.js
const Alumno    = require('../models/Alumno');
const Matricula = require('../models/Matricula');

// Generar próximo expediente automático
const proximoExpediente = async () => {
  const anio  = new Date().getFullYear();
  const count = await Alumno.countDocuments();
  return `EXP-${anio}-${String(count + 1).padStart(4, '0')}`;
};

// ── Listar ──────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const busqueda = req.query.q || '';
    const filtro   = busqueda ? {
      $or: [
        { nombre:     { $regex: busqueda, $options: 'i' } },
        { apellido:   { $regex: busqueda, $options: 'i' } },
        { expediente: { $regex: busqueda, $options: 'i' } },
      ],
    } : {};

    const alumnos = await Alumno.find(filtro).sort({ apellido: 1, nombre: 1 });

    // Una sola consulta trae todas las matrículas activas relevantes,
    // en vez de consultar la matrícula de cada alumno por separado.
    const matriculas = await Matricula.find({
      alumno: { $in: alumnos.map(a => a._id) }, estado: 'activa',
    }).populate({ path: 'seccion', populate: { path: 'grado' } });

    const matriculaPorAlumno = {};
    matriculas.forEach(m => { matriculaPorAlumno[m.alumno.toString()] = m; });

    const alumnosConMatricula = alumnos.map(a => ({
      ...a.toObject(),
      matricula: matriculaPorAlumno[a._id.toString()] || null,
    }));

    res.render('alumnos/index', { titulo: 'Alumnos', alumnos: alumnosConMatricula, busqueda });
  } catch (e) {
    req.flash('error', 'Error al cargar los alumnos.');
    res.redirect('/dashboard');
  }
};

// ── Formulario nuevo ────────────────────────────────────────────────────
const mostrarFormNuevo = async (req, res) => {
  try {
    const expediente = await proximoExpediente();
    res.render('alumnos/form', {
      titulo: 'Nuevo Alumno',
      alumno: { expediente },
      esEditar: false,
    });
  } catch (e) {
    req.flash('error', 'Error al cargar el formulario.');
    res.redirect('/alumnos');
  }
};

// ── Guardar ─────────────────────────────────────────────────────────────
// El grado, sección y jornada del alumno se definen al matricularlo
// (módulo Matrículas), no aquí — evita mantener el mismo dato en dos lugares.
const guardar = async (req, res) => {
  try {
    const {
      expediente, nombre, apellido, numIdentidad,
      fechaNacimiento, genero, correo, telefono,
      direccion, nombreTutor, telefonoTutor, estado,
    } = req.body;

    const existe = await Alumno.findOne({ expediente: expediente?.toUpperCase().trim() });
    if (existe) {
      req.flash('error', `El expediente "${expediente}" ya está registrado.`);
      return res.redirect('/alumnos/nuevo');
    }

    await Alumno.create({
      expediente: expediente.toUpperCase().trim(),
      nombre, apellido, numIdentidad,
      fechaNacimiento: fechaNacimiento || null,
      genero, correo, telefono, direccion,
      nombreTutor, telefonoTutor,
      estado: estado || 'activo',
    });

    req.flash('exito', `Alumno ${nombre} ${apellido} registrado correctamente. Ahora puedes matricularlo desde Matrículas.`);
    res.redirect('/alumnos');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar el alumno.');
    res.redirect('/alumnos/nuevo');
  }
};

// ── Ver detalle ──────────────────────────────────────────────────────────
const ver = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.params.id);
    if (!alumno) { req.flash('error', 'Alumno no encontrado.'); return res.redirect('/alumnos'); }

    // Grado/sección/jornada reales se leen de la matrícula activa, no de
    // campos copiados en el alumno — así no hay dos versiones del mismo dato.
    const matricula = await Matricula.findOne({ alumno: alumno._id, estado: 'activa' })
      .populate({ path: 'seccion', populate: { path: 'grado' } })
      .populate('padre');

    res.render('alumnos/ver', { titulo: 'Detalle del Alumno', alumno, matricula });
  } catch (e) {
    req.flash('error', 'Error al cargar el alumno.');
    res.redirect('/alumnos');
  }
};

// ── Formulario editar ────────────────────────────────────────────────────
const mostrarFormEditar = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.params.id);
    if (!alumno) { req.flash('error', 'Alumno no encontrado.'); return res.redirect('/alumnos'); }
    res.render('alumnos/form', { titulo: 'Editar Alumno', alumno, esEditar: true });
  } catch (e) {
    req.flash('error', 'Error al cargar el formulario.');
    res.redirect('/alumnos');
  }
};

// ── Actualizar ───────────────────────────────────────────────────────────
const actualizar = async (req, res) => {
  try {
    const {
      nombre, apellido, numIdentidad,
      fechaNacimiento, genero, correo, telefono,
      direccion, nombreTutor, telefonoTutor, estado,
    } = req.body;

    await Alumno.findByIdAndUpdate(req.params.id, {
      nombre, apellido, numIdentidad,
      fechaNacimiento: fechaNacimiento || null,
      genero, correo, telefono, direccion,
      nombreTutor, telefonoTutor,
      estado: estado || 'activo',
    });

    req.flash('exito', 'Alumno actualizado correctamente.');
    res.redirect('/alumnos');
  } catch (e) {
    req.flash('error', 'Error al actualizar el alumno.');
    res.redirect(`/alumnos/${req.params.id}/editar`);
  }
};

// ── Eliminar ─────────────────────────────────────────────────────────────
const eliminar = async (req, res) => {
  await Alumno.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Alumno eliminado correctamente.');
  res.redirect('/alumnos');
};

module.exports = { listar, mostrarFormNuevo, guardar, ver, mostrarFormEditar, actualizar, eliminar };
