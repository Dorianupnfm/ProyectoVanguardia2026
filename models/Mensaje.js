// models/Mensaje.js — Mensaje individual dentro de una conversación
const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  conversacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversacion', required: true },
  emisor:       { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  contenido:    { type: String, default: '', trim: true },
  // Adjunto opcional (imagen o documento)
  adjunto: {
    nombre:    { type: String, default: null },  // nombre original del archivo
    ruta:      { type: String, default: null },  // ruta relativa en /uploads/mensajeria/
    tipo:      { type: String, default: null },  // mimetype
    esImagen:  { type: Boolean, default: false },
  },
  leidoPor:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', mensajeSchema);
