// controllers/mensajeriaController.js — Chat interno
const Conversacion = require('../models/Conversacion');
const Mensaje       = require('../models/Mensaje');
const Usuario       = require('../models/Usuario');
const Padre         = require('../models/Padre');
const Matricula      = require('../models/Matricula');
const Docente       = require('../models/Docente');
const Alumno        = require('../models/Alumno');

// ── Bandeja de entrada ──────────────────────────────────────────────
const bandeja = async (req, res) => {
  try {
    const conversaciones = await Conversacion.find({ participantes: req.session.usuarioId })
      .populate('participantes', 'nombre rol')
      .populate('alumnoRelacionado', 'nombre apellido')
      .sort({ ultimaFecha: -1 });

    res.render('mensajeria/bandeja', { titulo: 'Mensajes', conversaciones });
  } catch (e) {
    req.flash('error', 'Error al cargar mensajes.');
    res.redirect('/dashboard');
  }
};

// ── Ver / continuar una conversación ────────────────────────────────
const verConversacion = async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.id)
      .populate('participantes', 'nombre rol')
      .populate('alumnoRelacionado', 'nombre apellido');

    if (!conv || !conv.participantes.some(p => p._id.toString() === req.session.usuarioId.toString())) {
      req.flash('error', 'Conversación no encontrada o sin acceso.');
      return res.redirect('/mensajeria');
    }

    const mensajes = await Mensaje.find({ conversacion: conv._id })
      .populate('emisor', 'nombre rol').sort({ createdAt: 1 });

    // Marcar como leído
    await Mensaje.updateMany(
      { conversacion: conv._id, leidoPor: { $ne: req.session.usuarioId } },
      { $addToSet: { leidoPor: req.session.usuarioId } }
    );

    res.render('mensajeria/conversacion', { titulo: conv.asunto || 'Conversación', conv, mensajes });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al cargar la conversación.');
    res.redirect('/mensajeria');
  }
};

// ── Enviar mensaje en conversación existente ────────────────────────
const enviarMensaje = async (req, res) => {
  try {
    const { contenido } = req.body;
    const tieneAdjunto = req.file != null;

    if (!contenido?.trim() && !tieneAdjunto) {
      return res.redirect('/mensajeria/' + req.params.id);
    }

    let adjunto = { nombre: null, ruta: null, tipo: null, esImagen: false };
    if (tieneAdjunto) {
      adjunto = {
        nombre:   req.file.originalname,
        ruta:     '/uploads/mensajeria/' + req.file.filename,
        tipo:     req.file.mimetype,
        esImagen: req.file.mimetype.startsWith('image/'),
      };
    }

    await Mensaje.create({
      conversacion: req.params.id, emisor: req.session.usuarioId,
      contenido: (contenido || '').trim(), adjunto,
      leidoPor: [req.session.usuarioId],
    });

    const resumen = contenido?.trim()
      ? contenido.trim().substring(0, 80)
      : (tieneAdjunto ? '[Adjunto: ' + req.file.originalname + ']' : '');

    await Conversacion.findByIdAndUpdate(req.params.id, {
      ultimoMensaje: resumen, ultimaFecha: new Date(),
    });

    res.redirect('/mensajeria/' + req.params.id);
  } catch (e) {
    req.flash('error', 'Error al enviar el mensaje.');
    res.redirect('/mensajeria/' + req.params.id);
  }
};

// ── Formulario nueva conversación ───────────────────────────────────
const formNueva = async (req, res) => {
  const rol = req.session.usuario.rol;
  let contactos = [];

  if (rol === 'padre') {
    // El padre puede escribir a docentes de sus hijos o a administración
    const padre = await Padre.findOne({ usuario: req.session.usuarioId });
    const hijos = padre
      ? (await Matricula.find({ padre: padre._id, estado: 'activa' }).populate('alumno')).map(m => m.alumno)
      : [];
    contactos = await Usuario.find({ rol: { $in: ['docente','director','subdirector','secretario'] }, estado: 'activo' })
      .select('nombre rol').sort({ nombre: 1 });
    return res.render('mensajeria/nueva', { titulo: 'Nuevo Mensaje', contactos, hijos });
  }

  if (rol === 'docente') {
    // El docente escribe a padres de sus alumnos o a administración
    contactos = await Usuario.find({ rol: { $in: ['padre','director','subdirector'] }, estado: 'activo' })
      .select('nombre rol').sort({ nombre: 1 });
  } else {
    // Admin/staff puede escribir a cualquiera
    contactos = await Usuario.find({ _id: { $ne: req.session.usuarioId }, estado: 'activo' })
      .select('nombre rol').sort({ nombre: 1 });
  }

  res.render('mensajeria/nueva', { titulo: 'Nuevo Mensaje', contactos, hijos: [] });
};

// ── Crear conversación nueva ─────────────────────────────────────────
const crearConversacion = async (req, res) => {
  try {
    const { destinatarioId, asunto, contenido, alumnoId } = req.body;
    const tieneAdjunto = req.file != null;

    if (!destinatarioId || (!contenido?.trim() && !tieneAdjunto)) {
      req.flash('error', 'Selecciona un destinatario y escribe un mensaje o adjunta un archivo.');
      return res.redirect('/mensajeria/nueva');
    }

    let adjunto = { nombre: null, ruta: null, tipo: null, esImagen: false };
    if (tieneAdjunto) {
      adjunto = {
        nombre:   req.file.originalname,
        ruta:     '/uploads/mensajeria/' + req.file.filename,
        tipo:     req.file.mimetype,
        esImagen: req.file.mimetype.startsWith('image/'),
      };
    }

    const resumen = contenido?.trim()
      ? contenido.trim().substring(0, 80)
      : (tieneAdjunto ? '[Adjunto: ' + req.file.originalname + ']' : '');

    // Buscar si ya existe conversación entre estos 2 participantes con el mismo asunto
    let conv = await Conversacion.findOne({
      participantes: { $all: [req.session.usuarioId, destinatarioId], $size: 2 },
      alumnoRelacionado: alumnoId || null,
    });

    if (!conv) {
      conv = await Conversacion.create({
        participantes: [req.session.usuarioId, destinatarioId],
        asunto: asunto || 'Conversación',
        alumnoRelacionado: alumnoId || null,
        ultimoMensaje: resumen,
        ultimaFecha: new Date(),
      });
    } else {
      conv.ultimoMensaje = resumen;
      conv.ultimaFecha   = new Date();
      await conv.save();
    }

    await Mensaje.create({
      conversacion: conv._id, emisor: req.session.usuarioId,
      contenido: (contenido || '').trim(), adjunto,
      leidoPor: [req.session.usuarioId],
    });

    req.flash('exito', 'Mensaje enviado.');
    res.redirect('/mensajeria/' + conv._id);
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al enviar: ' + e.message);
    res.redirect('/mensajeria/nueva');
  }
};

// ── Contador de no leídos (para badge en sidebar) ───────────────────
const contarNoLeidos = async (usuarioId) => {
  const convs = await Conversacion.find({ participantes: usuarioId }).select('_id');
  const ids = convs.map(c => c._id);
  return Mensaje.countDocuments({ conversacion: { $in: ids }, leidoPor: { $ne: usuarioId } });
};

module.exports = { bandeja, verConversacion, enviarMensaje, formNueva, crearConversacion, contarNoLeidos };
