// models/Conversacion.js — Hilo de conversación entre 2 o más usuarios
const mongoose = require('mongoose');

const conversacionSchema = new mongoose.Schema({
  participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }],
  asunto:        { type: String, trim: true, default: '' },
  ultimoMensaje: { type: String, trim: true, default: '' },
  ultimaFecha:   { type: Date, default: Date.now },
  alumnoRelacionado: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', default: null }, // contexto: sobre qué estudiante
}, { timestamps: true });

module.exports = mongoose.model('Conversacion', conversacionSchema);
