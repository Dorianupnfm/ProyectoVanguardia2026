// controllers/alumnosController.js
const Alumno  = require('../models/Alumno');
const Grado   = require('../models/Grado');
const Seccion = require('../models/Seccion');

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
    res.render('alumnos/index', { titulo: 'Alumnos', alumnos, busqueda });
  } catch (e) {
    req.flash('error', 'Error al cargar los alumnos.');
    res.redirect('/dashboard');
  }
};

// ── Formulario nuevo ────────────────────────────────────────────────────
const mostrarFormNuevo = async (req, res) => {
  try {
    const [grados, expediente] = await Promise.all([
      Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
      proximoExpediente(),
    ]);
    res.render('alumnos/form', {
      titulo: 'Nuevo Alumno',
      alumno: { expediente },
      grados,
      seccionesIniciales: [],
      esEditar: false,
    });
  } catch (e) {
    req.flash('error', 'Error al cargar el formulario.');
    res.redirect('/alumnos');
  }
};

// ── Guardar ─────────────────────────────────────────────────────────────
const guardar = async (req, res) => {
  try {
    const {
      expediente, nombre, apellido, numIdentidad,
      fechaNacimiento, genero, correo, telefono,
      direccion, gradoId, seccionId, nombreTutor, telefonoTutor, estado,
    } = req.body;

    // Validar expediente único
    const existe = await Alumno.findOne({ expediente: expediente?.toUpperCase().trim() });
    if (existe) {
      req.flash('error', `El expediente "${expediente}" ya está registrado.`);
      return res.redirect('/alumnos/nuevo');
    }

    // Obtener datos de grado y sección desde BD
    let gradoNombre = '', seccionNombre = '', jornadaVal = 'matutina';
    if (seccionId) {
      const sec = await Seccion.findById(seccionId).populate('grado');
      if (sec) {
        seccionNombre = sec.nombre;
        jornadaVal    = sec.jornada;
        gradoNombre   = sec.grado?.nombre || '';
      }
    } else if (gradoId) {
      const g = await Grado.findById(gradoId);
      if (g) gradoNombre = g.nombre;
    }

    await Alumno.create({
      expediente: expediente.toUpperCase().trim(),
      nombre, apellido, numIdentidad,
      fechaNacimiento: fechaNacimiento || null,
      genero, correo, telefono, direccion,
      grado: gradoNombre,
      seccion: seccionNombre,
      jornada: jornadaVal,
      nombreTutor, telefonoTutor,
      estado: estado || 'activo',
    });

    req.flash('exito', `Alumno ${nombre} ${apellido} registrado correctamente.`);
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
    res.render('alumnos/ver', { titulo: 'Detalle del Alumno', alumno });
  } catch (e) {
    req.flash('error', 'Error al cargar el alumno.');
    res.redirect('/alumnos');
  }
};

// ── Formulario editar ────────────────────────────────────────────────────
const mostrarFormEditar = async (req, res) => {
  try {
    const [alumno, grados] = await Promise.all([
      Alumno.findById(req.params.id),
      Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
    ]);
    if (!alumno) { req.flash('error', 'Alumno no encontrado.'); return res.redirect('/alumnos'); }

    // Pre-cargar secciones del grado actual si existe
    let seccionesIniciales = [];
    if (alumno.grado) {
      const gradoDoc = await Grado.findOne({ nombre: alumno.grado, estado: 'activo' });
      if (gradoDoc) {
        seccionesIniciales = await Seccion.find({ grado: gradoDoc._id, estado: 'activa' }).sort({ nombre: 1 });
      }
    }

    res.render('alumnos/form', {
      titulo: 'Editar Alumno',
      alumno,
      grados,
      seccionesIniciales,
      esEditar: true,
    });
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
      direccion, gradoId, seccionId, nombreTutor, telefonoTutor, estado,
    } = req.body;

    let gradoNombre = '', seccionNombre = '', jornadaVal = 'matutina';
    if (seccionId) {
      const sec = await Seccion.findById(seccionId).populate('grado');
      if (sec) {
        seccionNombre = sec.nombre;
        jornadaVal    = sec.jornada;
        gradoNombre   = sec.grado?.nombre || '';
      }
    } else if (gradoId) {
      const g = await Grado.findById(gradoId);
      if (g) gradoNombre = g.nombre;
    }

    await Alumno.findByIdAndUpdate(req.params.id, {
      nombre, apellido, numIdentidad,
      fechaNacimiento: fechaNacimiento || null,
      genero, correo, telefono, direccion,
      grado: gradoNombre,
      seccion: seccionNombre,
      jornada: jornadaVal,
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
