// controllers/padrePortalController.js
const Padre      = require('../models/Padre');
const Matricula   = require('../models/Matricula');
const Nota        = require('../models/Nota');
const Actividad   = require('../models/Actividad');
const Asistencia  = require('../models/Asistencia');
const Asignatura  = require('../models/Asignatura');
const Parcial     = require('../models/Parcial');
const { COMPONENTES, COMPONENTE_PESOS } = require('../models/Actividad');
const { obtenerTodo } = require('./configuracionController');

const getPadre = (usuarioId) => Padre.findOne({ usuario: usuarioId });

// Matrículas activas de los hijos de un padre — fuente única del vínculo
const getMatriculasHijos = (padreId) =>
  Matricula.find({ padre: padreId, estado: 'activa' })
    .populate('alumno')
    .populate({ path: 'seccion', populate: { path: 'grado' } });

const dashboard = async (req, res) => {
  const padre = await getPadre(req.session.usuarioId);
  if (!padre) {
    req.flash('error', 'Tu cuenta no está vinculada a ningún estudiante. Contacta al centro educativo.');
    return res.render('padre/sin-vincular', { titulo: 'Portal de Padres' });
  }

  const matriculas = await getMatriculasHijos(padre._id);
  const hijos = matriculas.map(m => ({ alumno: m.alumno, matricula: m }));

  if (!hijos.length) {
    req.flash('error', 'Aún no tienes ningún estudiante vinculado. Esto se hace desde la matrícula en el centro educativo.');
  }

  res.render('padre/dashboard', { titulo: 'Portal de Padres', padre, hijos });
};

const verHijo = async (req, res) => {
  const padre = await getPadre(req.session.usuarioId);
  const alumnoId = req.params.id;
  if (!padre) return res.redirect('/portal-padre');

  // Verificar que ese hijo está vinculado a este padre vía matrícula activa
  const matricula = await Matricula.findOne({ padre: padre._id, alumno: alumnoId, estado: 'activa' })
    .populate('alumno')
    .populate({ path: 'seccion', populate: [{ path:'grado' },{ path:'docente' }] });

  if (!matricula) {
    req.flash('error', 'No tienes acceso a la información de ese estudiante.');
    return res.redirect('/portal-padre');
  }

  const alumno = matricula.alumno;
  let asignaturas = [], asistenciaResumen = null;
  if (matricula.seccion) {
    // populate explícito del docente para garantizar que el objeto llegue completo
    asignaturas = await Asignatura.find({ grado: matricula.seccion.grado._id, estado: 'activa' })
      .populate({ path: 'docente', select: 'nombre apellido especialidad' });

    const registros = await Asistencia.find({ seccion: matricula.seccion._id })
      .sort({ fecha: -1 }).limit(20);
    let presentes=0, ausentes=0, tarde=0, excusa=0;
    registros.forEach(r => {
      const det = r.detalle.find(d => d.alumno.toString() === alumnoId);
      if (!det) return;
      if (det.estado==='presente') presentes++;
      else if (det.estado==='ausente') ausentes++;
      else if (det.estado==='tarde') tarde++;
      else if (det.estado==='excusa') excusa++;
    });
    asistenciaResumen = { presentes, ausentes, tarde, excusa, total: presentes+ausentes+tarde+excusa };
  }

  res.render('padre/ver-hijo', { titulo: alumno.nombre + ' ' + alumno.apellido, alumno, matricula, asignaturas, asistenciaResumen });
};

const notasHijo = async (req, res) => {
  const padre = await getPadre(req.session.usuarioId);
  const alumnoId = req.params.id;
  if (!padre) return res.redirect('/portal-padre');

  const matricula = await Matricula.findOne({ padre: padre._id, alumno: alumnoId, estado: 'activa' })
    .populate('alumno')
    .populate({ path: 'seccion', populate: { path: 'grado' } });

  if (!matricula) {
    req.flash('error', 'Sin acceso.');
    return res.redirect('/portal-padre');
  }

  const alumno = matricula.alumno;
  let resumenPorAsignatura = [];
  const notaMinima = 60; // default; se podría leer de configuración

  if (matricula.seccion) {
    const asignaturas = await Asignatura.find({ grado: matricula.seccion.grado._id, estado: 'activa' })
      .populate({ path: 'docente', select: 'nombre apellido especialidad' });
    const parciales   = await Parcial.asegurarParcialesDelAnio(new Date().getFullYear());

    for (const asig of asignaturas) {
      const porParcial = [];
      for (const parcial of parciales) {
        const actividades = await Actividad.find({ asignatura: asig._id, seccion: matricula.seccion._id, parcial: parcial._id });
        const notas = await Nota.find({ actividad: { $in: actividades.map(a => a._id) }, alumno: alumnoId });
        const notaMap = {};
        notas.forEach(n => { notaMap[n.actividad.toString()] = n.nota; });

        // Calcular Nota Final ponderada por componente (igual que el libro de notas)
        let notaFinal = 0;
        const tieneNotas = notas.length > 0;
        COMPONENTES.forEach(comp => {
          const actsComp = actividades.filter(a => a.componente === comp);
          let obtenido = 0, maximo = 0;
          actsComp.forEach(a => {
            maximo += a.puntajeMax;
            if (notaMap[a._id.toString()] !== undefined) obtenido += notaMap[a._id.toString()];
          });
          const peso = COMPONENTE_PESOS[comp];
          if (maximo > 0) notaFinal += (obtenido / maximo) * peso;
        });
        notaFinal = Math.round(notaFinal * 10) / 10;

        porParcial.push({
          parcial,
          actividades: actividades.length,
          notaFinal: tieneNotas ? notaFinal : null,
          aprobado:  tieneNotas ? notaFinal >= notaMinima : null,
        });
      }

      // Promedio general de los parciales con nota registrada
      const parcialesConNota = porParcial.filter(p => p.notaFinal !== null);
      const promedioGeneral = parcialesConNota.length
        ? Math.round(parcialesConNota.reduce((s, p) => s + p.notaFinal, 0) / parcialesConNota.length * 10) / 10
        : null;

      resumenPorAsignatura.push({
        asignatura: asig,
        porParcial,
        promedioGeneral,
        aprobado: promedioGeneral !== null ? promedioGeneral >= notaMinima : null,
      });
    }
  }

  res.render('padre/notas-hijo', { titulo: 'Progreso de ' + alumno.nombre, alumno, matricula, resumenPorAsignatura, notaMinima });
};

module.exports = { dashboard, verHijo, notasHijo, getPadre, getMatriculasHijos };
