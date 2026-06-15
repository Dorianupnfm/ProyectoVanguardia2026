// models/Asistencia.js
// Registro de asistencia por clase/sesión

const mongoose = require('mongoose');

// Detalle por alumno dentro de una sesión
const detalleSchema = new mongoose.Schema({
  alumno:     { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true },
  estado:     { type: String, enum: ['presente','ausente','tarde','excusa'], default: 'presente' },
  comentario: { type: String, trim: true, default: '' },
}, { _id: false });

const asistenciaSchema = new mongoose.Schema({
  asignatura: { type: mongoose.Schema.Types.ObjectId, ref: 'Asignatura', required: true },
  seccion:    { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion',    required: true },
  docente:    { type: mongoose.Schema.Types.ObjectId, ref: 'Docente',    required: true },
  fecha:      { type: Date, required: true },
  tema:       { type: String, trim: true, default: '' },      // tema de la clase
  comentarioGeneral: { type: String, trim: true, default: '' },
  detalle:    [detalleSchema],
}, { timestamps: true });

// Índice para no duplicar sesión del mismo día por asignatura
asistenciaSchema.index({ asignatura: 1, seccion: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('Asistencia', asistenciaSchema);
