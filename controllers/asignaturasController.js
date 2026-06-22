// controllers/asignaturasController.js
const Asignatura = require('../models/Asignatura');
const Grado      = require('../models/Grado');
const Docente    = require('../models/Docente');

const listar = async (req, res) => {
  const asignaturas = await Asignatura.find().populate('grado').populate('docente').sort({ nombre: 1 }).catch(() => []);
  res.render('asignaturas/index', { titulo: 'Asignaturas', asignaturas });
};

const formNueva = async (req, res) => {
  const [grados, docentes] = await Promise.all([
    Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
    Docente.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]);
  res.render('asignaturas/form', { titulo: 'Nueva Asignatura', asignatura: {}, grados, docentes, esEditar: false });
};

const guardar = async (req, res) => {
  const { nombre, codigo, grado, docente, horasSemana, estado } = req.body;
  await Asignatura.create({ nombre, codigo, grado, docente: docente || null, horasSemana: +horasSemana || 4, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Asignatura registrada correctamente.');
  res.redirect('/asignaturas');
};

const formEditar = async (req, res) => {
  const [asignatura, grados, docentes] = await Promise.all([
    Asignatura.findById(req.params.id).populate('grado').populate('docente'),
    Grado.find({ estado: 'activo' }).sort({ nombre: 1 }),
    Docente.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]).catch(() => [null, [], []]);
  if (!asignatura) { req.flash('error', 'Asignatura no encontrada.'); return res.redirect('/asignaturas'); }
  res.render('asignaturas/form', { titulo: 'Editar Asignatura', asignatura, grados, docentes, esEditar: true });
};

const actualizar = async (req, res) => {
  const { nombre, codigo, grado, docente, horasSemana, estado } = req.body;
  await Asignatura.findByIdAndUpdate(req.params.id, { nombre, codigo, grado, docente: docente || null, horasSemana: +horasSemana, estado })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Asignatura actualizada.');
  res.redirect('/asignaturas');
};

const eliminar = async (req, res) => {
  await Asignatura.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Asignatura eliminada.');
  res.redirect('/asignaturas');
};

module.exports = { listar, formNueva, guardar, formEditar, actualizar, eliminar };
