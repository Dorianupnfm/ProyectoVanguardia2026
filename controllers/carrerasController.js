// controllers/carrerasController.js
const Carrera = require('../models/Carrera');

const listar = async (req, res) => {
  const carreras = await Carrera.find().sort({ nombre: 1 }).catch(() => []);
  res.render('carreras/index', { titulo: 'Carreras', carreras });
};

const formNueva = (req, res) =>
  res.render('carreras/form', { titulo: 'Nueva Carrera', carrera: {}, esEditar: false });

const guardar = async (req, res) => {
  const { nombre, codigo, descripcion, duracion, estado } = req.body;
  await Carrera.create({ nombre, codigo, descripcion, duracion: +duracion || 3, estado })
    .catch(e => req.flash('error', e.code === 11000 ? 'Esa carrera ya existe.' : e.message));
  req.flash('exito', 'Carrera registrada correctamente.');
  res.redirect('/carreras');
};

const formEditar = async (req, res) => {
  const carrera = await Carrera.findById(req.params.id).catch(() => null);
  if (!carrera) { req.flash('error', 'Carrera no encontrada.'); return res.redirect('/carreras'); }
  res.render('carreras/form', { titulo: 'Editar Carrera', carrera, esEditar: true });
};

const actualizar = async (req, res) => {
  const { nombre, codigo, descripcion, duracion, estado } = req.body;
  await Carrera.findByIdAndUpdate(req.params.id, { nombre, codigo, descripcion, duracion: +duracion, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Carrera actualizada.');
  res.redirect('/carreras');
};

const eliminar = async (req, res) => {
  await Carrera.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Carrera eliminada.');
  res.redirect('/carreras');
};

module.exports = { listar, formNueva, guardar, formEditar, actualizar, eliminar };
