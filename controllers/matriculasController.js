// controllers/matriculasController.js
const Matricula  = require('../models/Matricula');
const Alumno     = require('../models/Alumno');
const Seccion    = require('../models/Seccion');
const Padre      = require('../models/Padre');
const Usuario    = require('../models/Usuario');
const { generarPasswordTemporal } = require('../config/passwordGenerator');

const listar = async (req, res) => {
  const anio = req.query.anio || new Date().getFullYear();
  const matriculas = await Matricula.find({ anioEscolar: +anio })
    .populate('alumno').populate('padre')
    .populate({ path: 'seccion', populate: { path: 'grado' } })
    .sort({ createdAt: -1 }).catch(() => []);
  const anios = [...new Set(await Matricula.distinct('anioEscolar'))].sort((a,b)=>b-a);
  res.render('matriculas/index', { titulo: 'Matrículas', matriculas, anio: +anio, anios });
};

const formNueva = async (req, res) => {
  const [alumnos, secciones, padres] = await Promise.all([
    Alumno.find({ estado: 'activo' }).sort({ apellido: 1 }),
    Seccion.find({ estado: 'activa' }).populate({ path: 'grado', populate: { path: 'carrera' } }).sort({ nombre: 1 }),
    Padre.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]);
  res.render('matriculas/form', { titulo: 'Nueva Matrícula', matricula: {}, alumnos, secciones, padres, esEditar: false });
};

const guardar = async (req, res) => {
  const {
    alumno, seccion, anioEscolar, fechaMatricula, estado, observaciones,
    // Vinculación de padre/encargado en el mismo paso
    padreId, crearPadre,
    padreNombre, padreApellido, padreNumIdentidad, padreParentesco,
    padreTelefono, padreCorreo, padreDireccion, padreOcupacion,
    crearUsuarioPadre,
  } = req.body;

  // Verificar si ya tiene matrícula activa en ese año
  const yaExiste = await Matricula.findOne({ alumno, anioEscolar: +anioEscolar, estado: 'activa' });
  if (yaExiste) {
    req.flash('error', 'Este alumno ya tiene una matrícula activa para ese año.');
    return res.redirect('/matriculas/nueva');
  }

  try {
    // ── Resolver el padre/encargado: existente o nuevo ──────────────
    let padreFinalId = null;
    let avisoAcceso = '';

    if (crearPadre === 'on') {
      if (!padreNombre || !padreApellido) {
        req.flash('error', 'Indica al menos nombre y apellido del padre/encargado.');
        return res.redirect('/matriculas/nueva');
      }

      let usuarioId = null;

      if (crearUsuarioPadre === 'on') {
        if (!padreCorreo) {
          req.flash('error', 'Para crear el acceso al sistema del padre/encargado se necesita un correo electrónico.');
          return res.redirect('/matriculas/nueva');
        }
        const correoExiste = await Usuario.findOne({ email: padreCorreo.toLowerCase() });
        if (correoExiste) {
          req.flash('error', 'Ya existe un usuario con ese correo de padre.');
          return res.redirect('/matriculas/nueva');
        }

        // La contraseña se genera automáticamente — el Director/Administrativo
        // la verá en pantalla desde la ficha del padre para entregarla.
        const passwordGenerada = generarPasswordTemporal();
        const nuevoUsuario = await Usuario.create({
          nombre: padreNombre + ' ' + padreApellido, email: padreCorreo, password: passwordGenerada, rol: 'padre',
        });
        usuarioId = nuevoUsuario._id;
        avisoAcceso = ' Entra a la ficha del padre/encargado y usa "Ver contraseña" para consultar y entregarle sus credenciales.';
      }

      const nuevoPadre = await Padre.create({
        nombre: padreNombre, apellido: padreApellido, numIdentidad: padreNumIdentidad,
        parentesco: padreParentesco || 'padre', telefono: padreTelefono, correo: padreCorreo,
        direccion: padreDireccion, ocupacion: padreOcupacion, usuario: usuarioId,
      });
      padreFinalId = nuevoPadre._id;
    } else if (padreId) {
      padreFinalId = padreId;
    }

    await Matricula.create({
      alumno, seccion, padre: padreFinalId, anioEscolar: +anioEscolar,
      fechaMatricula: fechaMatricula || Date.now(), estado, observaciones,
    });

    req.flash('exito', 'Matrícula registrada correctamente.' + (padreFinalId ? ' Padre/encargado vinculado.' + avisoAcceso : ''));
    res.redirect('/matriculas');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al registrar la matrícula: ' + e.message);
    res.redirect('/matriculas/nueva');
  }
};

const ver = async (req, res) => {
  const matricula = await Matricula.findById(req.params.id)
    .populate('alumno').populate('padre')
    .populate({ path: 'seccion', populate: [{ path: 'grado', populate: { path: 'carrera' } }, { path: 'docente' }] })
    .catch(() => null);
  if (!matricula) { req.flash('error', 'Matrícula no encontrada.'); return res.redirect('/matriculas'); }
  res.render('matriculas/ver', { titulo: 'Detalle de Matrícula', matricula });
};

const formEditar = async (req, res) => {
  const [matricula, secciones, padres] = await Promise.all([
    Matricula.findById(req.params.id).populate('alumno').populate('seccion').populate('padre'),
    Seccion.find({ estado: 'activa' }).populate({ path: 'grado', populate: { path: 'carrera' } }).sort({ nombre: 1 }),
    Padre.find({ estado: 'activo' }).sort({ apellido: 1 }),
  ]).catch(() => [null, [], []]);
  if (!matricula) { req.flash('error', 'Matrícula no encontrada.'); return res.redirect('/matriculas'); }
  res.render('matriculas/form', { titulo: 'Editar Matrícula', matricula, alumnos: [], secciones, padres, esEditar: true });
};

const actualizar = async (req, res) => {
  const { seccion, estado, observaciones, padreId } = req.body;
  await Matricula.findByIdAndUpdate(req.params.id, {
    seccion, estado, observaciones, padre: padreId || null,
  }).catch(e => req.flash('error', e.message));
  req.flash('exito', 'Matrícula actualizada.');
  res.redirect('/matriculas');
};

const eliminar = async (req, res) => {
  await Matricula.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Matrícula eliminada.');
  res.redirect('/matriculas');
};

module.exports = { listar, formNueva, guardar, ver, formEditar, actualizar, eliminar };
