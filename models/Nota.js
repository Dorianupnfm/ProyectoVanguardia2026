// models/Nota.js
// Nota de un estudiante en una actividad
const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
  actividad: { type: mongoose.Schema.Types.ObjectId, ref: 'Actividad', required: true },
  alumno:    { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno',    required: true },
  nota:      { type: Number, required: true, min: 0 },
  observacion: { type: String, trim: true, default: '' },
}, { timestamps: true });

// Un alumno solo tiene una nota por actividad
notaSchema.index({ actividad: 1, alumno: 1 }, { unique: true });

module.exports = mongoose.model('Nota', notaSchema);
