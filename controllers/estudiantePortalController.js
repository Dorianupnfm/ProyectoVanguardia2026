// controllers/estudiantePortalController.js
const Alumno      = require('../models/Alumno');
const Matricula    = require('../models/Matricula');
const Nota         = require('../models/Nota');
const Actividad    = require('../models/Actividad');
const Asistencia   = require('../models/Asistencia');
const Asignatura   = require('../models/Asignatura');

const getAlumno = (usuarioId) => Alumno.findOne({ usuario: usuarioId });

const dashboard = async (req, res) => {
  const alumno = await getAlumno(req.session.usuarioId);
  if (!alumno) {
    req.flash('error', 'Tu cuenta no está vinculada a un expediente de estudiante.');
    return res.render('estudiante/sin-vincular', { titulo: 'Portal del Estudiante' });
  }

  const matricula = await Matricula.findOne({ alumno: alumno._id, estado: 'activa' })
    .populate({ path: 'seccion', populate: [{ path:'grado' },{ path:'docente' }] });

  let asignaturas = [];
  if (matricula?.seccion) {
    asignaturas = await Asignatura.find({ grado: matricula.seccion.grado._id, estado: 'activa' }).populate('docente');
  }

  res.render('estudiante/dashboard', { titulo: 'Mi Portal', alumno, matricula, asignaturas });
};

const misNotas = async (req, res) => {
  const alumno = await getAlumno(req.session.usuarioId);
  if (!alumno) return res.redirect('/portal-estudiante');

  const matricula = await Matricula.findOne({ alumno: alumno._id, estado: 'activa' })
    .populate({ path: 'seccion', populate: { path: 'grado' } });

  let resumen = [];
  if (matricula?.seccion) {
    const asignaturas = await Asignatura.find({ grado: matricula.seccion.grado._id, estado: 'activa' });
    for (const asig of asignaturas) {
      const actividades = await Actividad.find({ asignatura: asig._id, seccion: matricula.seccion._id });
      const notas = await Nota.find({ actividad: { $in: actividades.map(a=>a._id) }, alumno: alumno._id });
      const total = notas.reduce((s,n)=>s+n.nota,0);
      const posible = actividades.filter(a=>notas.some(n=>n.actividad.toString()===a._id.toString())).reduce((s,a)=>s+a.puntajeMax,0);
      resumen.push({ asignatura: asig, total, posible, pct: posible>0?Math.round(total/posible*100):null });
    }
  }
  res.render('estudiante/mis-notas', { titulo: 'Mis Notas', resumen });
};

const miAsistencia = async (req, res) => {
  const alumno = await getAlumno(req.session.usuarioId);
  if (!alumno) return res.redirect('/portal-estudiante');

  const matricula = await Matricula.findOne({ alumno: alumno._id, estado: 'activa' });
  let registros = [];
  if (matricula) {
    const todos = await Asistencia.find({ seccion: matricula.seccion }).populate('asignatura').sort({ fecha: -1 }).limit(30);
    registros = todos.map(r => {
      const det = r.detalle.find(d => d.alumno.toString() === alumno._id.toString());
      return { fecha: r.fecha, asignatura: r.asignatura, estado: det ? det.estado : null, comentario: det ? det.comentario : '' };
    }).filter(r => r.estado);
  }
  res.render('estudiante/mi-asistencia', { titulo: 'Mi Asistencia', registros });
};

module.exports = { dashboard, misNotas, miAsistencia, getAlumno };
