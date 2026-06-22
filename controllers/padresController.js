// controllers/padresController.js
const Padre     = require('../models/Padre');
const Matricula = require('../models/Matricula');
const Usuario   = require('../models/Usuario');
const { generarPasswordTemporal } = require('../config/passwordGenerator');

const listar = async (req, res) => {
  const busqueda = req.query.q || '';
  const filtro = busqueda ? {
    $or: [
      { nombre:   { $regex: busqueda, $options: 'i' } },
      { apellido: { $regex: busqueda, $options: 'i' } },
    ],
  } : {};
  const padres = await Padre.find(filtro).sort({ apellido: 1 }).catch(() => []);

  // Contar hijos vinculados (vía Matricula) para mostrarlo en el listado
  const padresConHijos = await Promise.all(padres.map(async (p) => {
    const totalHijos = await Matricula.countDocuments({ padre: p._id, estado: 'activa' });
    return { ...p.toObject(), totalHijos };
  }));

  res.render('padres/index', { titulo: 'Padres de Familia', padres: padresConHijos, busqueda });
};

const formNuevo = (req, res) =>
  res.render('padres/form', { titulo: 'Nuevo Padre de Familia', padre: {}, esEditar: false });

const guardar = async (req, res) => {
  const { nombre, apellido, numIdentidad, parentesco, telefono, correo, direccion, ocupacion, crearUsuario } = req.body;

  try {
    let usuarioId = null;
    let nuevoPadreId = null;

    if (crearUsuario === 'on') {
      if (!correo) {
        req.flash('error', 'Para crear el acceso al sistema se necesita un correo electrónico.');
        return res.redirect('/padres/nuevo');
      }
      const existe = await Usuario.findOne({ email: correo.toLowerCase() });
      if (existe) {
        req.flash('error', 'Ya existe un usuario con ese correo.');
        return res.redirect('/padres/nuevo');
      }

      // La contraseña se genera automáticamente — el Director/Administrativo
      // la verá en pantalla para entregársela personalmente al padre.
      const passwordGenerada = generarPasswordTemporal();
      const nuevoUsuario = await Usuario.create({
        nombre: nombre + ' ' + apellido, email: correo, password: passwordGenerada, rol: 'padre',
      });
      usuarioId = nuevoUsuario._id;
    }

    const padreCreado = await Padre.create({
      nombre, apellido, numIdentidad, parentesco, telefono, correo, direccion, ocupacion,
      usuario: usuarioId,
    });
    nuevoPadreId = padreCreado._id;

    if (usuarioId) {
      // Redirige a la ficha del padre, donde el botón "Ver contraseña"
      // permite consultarla en pantalla en cualquier momento.
      req.flash('exito', `Padre/encargado ${nombre} ${apellido} registrado correctamente con acceso al sistema. Usa el botón "Ver contraseña" para consultar y entregarle sus credenciales.`);
    } else {
      req.flash('exito', `Padre/encargado ${nombre} ${apellido} registrado correctamente. Ahora puedes vincularlo a un estudiante desde Matrículas.`);
    }
    res.redirect('/padres/' + nuevoPadreId);
  } catch (e) {
    req.flash('error', 'Error al guardar: ' + e.message);
    res.redirect('/padres/nuevo');
  }
};

const ver = async (req, res) => {
  const padre = await Padre.findById(req.params.id).populate('usuario');
  if (!padre) { req.flash('error', 'No encontrado.'); return res.redirect('/padres'); }

  // Hijos vinculados vía matrícula (fuente única de verdad)
  const matriculas = await Matricula.find({ padre: padre._id, estado: 'activa' })
    .populate('alumno').populate({ path: 'seccion', populate: { path: 'grado' } });

  res.render('padres/ver', { titulo: 'Detalle del Padre', padre, matriculas });
};

const formEditar = async (req, res) => {
  const padre = await Padre.findById(req.params.id);
  if (!padre) { req.flash('error', 'No encontrado.'); return res.redirect('/padres'); }

  const matriculas = await Matricula.find({ padre: padre._id, estado: 'activa' }).populate('alumno');
  const padreConHijos = { ...padre.toObject(), hijos: matriculas.map(m => m.alumno) };

  res.render('padres/form', { titulo: 'Editar Padre de Familia', padre: padreConHijos, esEditar: true });
};

const actualizar = async (req, res) => {
  const { nombre, apellido, numIdentidad, parentesco, telefono, correo, direccion, ocupacion, estado } = req.body;
  await Padre.findByIdAndUpdate(req.params.id, {
    nombre, apellido, numIdentidad, parentesco, telefono, correo, direccion, ocupacion, estado,
  }).catch(e => req.flash('error', e.message));
  req.flash('exito', 'Padre actualizado.');
  res.redirect('/padres');
};

const eliminar = async (req, res) => {
  const tieneHijos = await Matricula.countDocuments({ padre: req.params.id, estado: 'activa' });
  if (tieneHijos > 0) {
    req.flash('error', 'No se puede eliminar: este padre está vinculado a matrículas activas. Edita primero esas matrículas.');
    return res.redirect('/padres');
  }
  await Padre.findByIdAndDelete(req.params.id).catch(() => {});
  req.flash('exito', 'Registro eliminado.');
  res.redirect('/padres');
};

// ── Crear acceso al sistema (o generar una nueva contraseña) para un
// padre que ya existe en el registro. La contraseña se genera y queda
// disponible para consultar en pantalla con el botón "Ver contraseña".
const generarAcceso = async (req, res) => {
  const padre = await Padre.findById(req.params.id);
  if (!padre) { req.flash('error', 'No encontrado.'); return res.redirect('/padres'); }

  if (!padre.correo) {
    req.flash('error', 'Este padre no tiene correo electrónico registrado. Edítalo primero para agregar uno (se usará como usuario de acceso).');
    return res.redirect('/padres');
  }

  try {
    const passwordGenerada = generarPasswordTemporal();

    if (padre.usuario) {
      // Ya tiene cuenta: se le asigna una contraseña nueva
      const usuario = await Usuario.findById(padre.usuario);
      if (!usuario) {
        req.flash('error', 'La cuenta vinculada ya no existe. Contacta al soporte técnico.');
        return res.redirect('/padres');
      }
      usuario.password = passwordGenerada;
      usuario.intentosFallidos = 0;
      usuario.bloqueadoHasta = null;
      await usuario.save();
      req.flash('exito', 'Se generó una nueva contraseña para ' + padre.nombre + '. Usa el botón "Ver contraseña" para consultarla.');
    } else {
      // No tiene cuenta todavía: se crea una nueva
      const existe = await Usuario.findOne({ email: padre.correo.toLowerCase() });
      if (existe) {
        req.flash('error', 'Ya existe un usuario del sistema con ese correo. Usa otro correo para este padre.');
        return res.redirect('/padres');
      }
      const usuario = await Usuario.create({
        nombre: padre.nombre + ' ' + padre.apellido, email: padre.correo, password: passwordGenerada, rol: 'padre',
      });
      padre.usuario = usuario._id;
      await padre.save();
      req.flash('exito', 'Acceso creado para ' + padre.nombre + '. Usa el botón "Ver contraseña" para consultarla y entregársela.');
    }

    res.redirect('/padres/' + padre._id);
  } catch (e) {
    req.flash('error', 'Error al generar el acceso: ' + e.message);
    res.redirect('/padres');
  }
};

module.exports = { listar, formNuevo, guardar, ver, formEditar, actualizar, eliminar, generarAcceso };
