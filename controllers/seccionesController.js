// controllers/seccionesController.js
const Seccion = require('../models/Seccion');
const Grado   = require('../models/Grado');
const Docente = require('../models/Docente');

const listar = async (req, res) => {
  const secciones = await Seccion.find().populate('grado').populate('docente').sort({ nombre: 1 }).catch(() => []);
  res.render('secciones/index', { titulo: 'Secciones', secciones });
};

const formNueva = async (req, res) => {
  const [grados, docentes] = await Promise.all([
    Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
    Docente.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]);
  res.render('secciones/form', { titulo: 'Nueva Sección', seccion: {}, grados, docentes, esEditar: false });
};

const guardar = async (req, res) => {
  const { nombre, grado, docente, jornada, capacidad, estado } = req.body;
  await Seccion.create({ nombre, grado, docente: docente || null, jornada, capacidad: +capacidad || 40, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Sección registrada correctamente.');
  res.redirect('/secciones');
};

const formEditar = async (req, res) => {
  const [seccion, grados, docentes] = await Promise.all([
    Seccion.findById(req.params.id).populate('grado').populate('docente'),
    Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
    Docente.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]).catch(() => [null, [], []]);
  if (!seccion) { req.flash('error', 'Sección no encontrada.'); return res.redirect('/secciones'); }
  res.render('secciones/form', { titulo: 'Editar Sección', seccion, grados, docentes, esEditar: true });
};

const actualizar = async (req, res) => {
  const { nombre, grado, docente, jornada, capacidad, estado } = req.body;
  await Seccion.findByIdAndUpdate(req.params.id, { nombre, grado, docente: docente || null, jornada, capacidad: +capacidad, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Sección actualizada.');
  res.redirect('/secciones');
};

const eliminar = async (req, res) => {
  await Seccion.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Sección eliminada.');
  res.redirect('/secciones');
};

module.exports = { listar, formNueva, guardar, formEditar, actualizar, eliminar };
