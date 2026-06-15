// controllers/docentesController.js
const Docente    = require('../models/Docente');
const Asignatura = require('../models/Asignatura');
const Seccion    = require('../models/Seccion');

const listar = async (req, res) => {
  const busqueda = req.query.q || '';
  const filtro   = busqueda ? {
    $or: [
      { nombre:       { $regex: busqueda, $options: 'i' } },
      { apellido:     { $regex: busqueda, $options: 'i' } },
      { especialidad: { $regex: busqueda, $options: 'i' } },
    ],
  } : {};
  const docentes = await Docente.find(filtro).sort({ apellido: 1, nombre: 1 }).catch(() => []);
  res.render('docentes/index', { titulo: 'Docentes', docentes, busqueda });
};

const mostrarFormNuevo = (req, res) =>
  res.render('docentes/form', { titulo: 'Nuevo Docente', docente: {}, esEditar: false });

const guardar = async (req, res) => {
  const { nombre, apellido, numIdentidad, correo, telefono, direccion, especialidad, titulo, tipoContrato, fechaIngreso, estado } = req.body;
  await Docente.create({ nombre, apellido, numIdentidad, correo, telefono, direccion, especialidad, titulo,
    tipoContrato: tipoContrato||'tiempo-completo', fechaIngreso: fechaIngreso || null, estado: estado || 'activo' })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', `Docente ${nombre} ${apellido} registrado correctamente.`);
  res.redirect('/docentes');
};

const ver = async (req, res) => {
  const [docente, asignaturas, secciones] = await Promise.all([
    Docente.findById(req.params.id),
    Asignatura.find({ docente: req.params.id, estado: 'activa' }).populate('grado'),
    Seccion.find({ docente: req.params.id, estado: 'activa' }).populate('grado'),
  ]).catch(() => [null, [], []]);

  if (!docente) { req.flash('error', 'Docente no encontrado.'); return res.redirect('/docentes'); }
  res.render('docentes/ver', { titulo: 'Ficha del Docente', docente, asignaturas, secciones });
};

const mostrarFormEditar = async (req, res) => {
  const docente = await Docente.findById(req.params.id).catch(() => null);
  if (!docente) { req.flash('error', 'Docente no encontrado.'); return res.redirect('/docentes'); }
  res.render('docentes/form', { titulo: 'Editar Docente', docente, esEditar: true });
};

const actualizar = async (req, res) => {
  const { nombre, apellido, numIdentidad, correo, telefono, direccion, especialidad, titulo, tipoContrato, fechaIngreso, estado } = req.body;
  await Docente.findByIdAndUpdate(req.params.id, { nombre, apellido, numIdentidad, correo, telefono, direccion,
    especialidad, titulo, tipoContrato: tipoContrato||'tiempo-completo', fechaIngreso: fechaIngreso || null, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Docente actualizado correctamente.');
  res.redirect('/docentes');
};

const eliminar = async (req, res) => {
  await Docente.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Docente eliminado.');
  res.redirect('/docentes');
};

module.exports = { listar, mostrarFormNuevo, guardar, ver, mostrarFormEditar, actualizar, eliminar };
