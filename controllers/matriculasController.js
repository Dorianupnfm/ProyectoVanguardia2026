// controllers/matriculasController.js
const Matricula  = require('../models/Matricula');
const Alumno     = require('../models/Alumno');
const Seccion    = require('../models/Seccion');

const listar = async (req, res) => {
  const anio = req.query.anio || new Date().getFullYear();
  const matriculas = await Matricula.find({ anioEscolar: +anio })
    .populate('alumno').populate({ path: 'seccion', populate: { path: 'grado' } })
    .sort({ createdAt: -1 }).catch(() => []);
  const anios = [...new Set(await Matricula.distinct('anioEscolar'))].sort((a,b)=>b-a);
  res.render('matriculas/index', { titulo: 'Matrículas', matriculas, anio: +anio, anios });
};

const formNueva = async (req, res) => {
  const [alumnos, secciones] = await Promise.all([
    Alumno.find({ estado: 'activo' }).sort({ apellido: 1 }),
    Seccion.find({ estado: 'activa' }).populate({ path: 'grado', populate: { path: 'carrera' } }).sort({ nombre: 1 }),
  ]);
  res.render('matriculas/form', { titulo: 'Nueva Matrícula', matricula: {}, alumnos, secciones, esEditar: false });
};

const guardar = async (req, res) => {
  const { alumno, seccion, anioEscolar, fechaMatricula, estado, observaciones } = req.body;
  // Verificar si ya tiene matrícula activa en ese año
  const yaExiste = await Matricula.findOne({ alumno, anioEscolar: +anioEscolar, estado: 'activa' });
  if (yaExiste) {
    req.flash('error', 'Este alumno ya tiene una matrícula activa para ese año.');
    return res.redirect('/matriculas/nueva');
  }
  await Matricula.create({ alumno, seccion, anioEscolar: +anioEscolar, fechaMatricula: fechaMatricula || Date.now(), estado, observaciones })
    .catch(e => req.flash('error', e.message));
  // Sincronizar datos en el alumno
  const sec = await Seccion.findById(seccion).populate('grado');
  if (sec) {
    await Alumno.findByIdAndUpdate(alumno, {
      grado: sec.grado?.nombre || '',
      seccion: sec.nombre,
      jornada: sec.jornada,
    });
  }
  req.flash('exito', 'Matrícula registrada correctamente.');
  res.redirect('/matriculas');
};

const ver = async (req, res) => {
  const matricula = await Matricula.findById(req.params.id)
    .populate('alumno')
    .populate({ path: 'seccion', populate: [{ path: 'grado', populate: { path: 'carrera' } }, { path: 'docente' }] })
    .catch(() => null);
  if (!matricula) { req.flash('error', 'Matrícula no encontrada.'); return res.redirect('/matriculas'); }
  res.render('matriculas/ver', { titulo: 'Detalle de Matrícula', matricula });
};

const formEditar = async (req, res) => {
  const [matricula, secciones] = await Promise.all([
    Matricula.findById(req.params.id).populate('alumno').populate('seccion'),
    Seccion.find({ estado: 'activa' }).populate({ path: 'grado', populate: { path: 'carrera' } }).sort({ nombre: 1 }),
  ]).catch(() => [null, []]);
  if (!matricula) { req.flash('error', 'Matrícula no encontrada.'); return res.redirect('/matriculas'); }
  res.render('matriculas/form', { titulo: 'Editar Matrícula', matricula, alumnos: [], secciones, esEditar: true });
};

const actualizar = async (req, res) => {
  const { seccion, estado, observaciones } = req.body;
  await Matricula.findByIdAndUpdate(req.params.id, { seccion, estado, observaciones })
    .catch(e => req.flash('error', e.message));
  req.flash('exito', 'Matrícula actualizada.');
  res.redirect('/matriculas');
};

const eliminar = async (req, res) => {
  await Matricula.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Matrícula eliminada.');
  res.redirect('/matriculas');
};

module.exports = { listar, formNueva, guardar, ver, formEditar, actualizar, eliminar };
