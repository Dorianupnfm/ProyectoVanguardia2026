// models/Seccion.js
const mongoose = require('mongoose');

const seccionSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true, uppercase: true },
  grado:    { type: mongoose.Schema.Types.ObjectId, ref: 'Grado', required: true },
  docente:  { type: mongoose.Schema.Types.ObjectId, ref: 'Docente', default: null }, // tutor
  jornada:  { type: String, enum: ['matutina','vespertina','nocturna'], default: 'matutina' },
  capacidad:{ type: Number, default: 40 },
  estado:   { type: String, enum: ['activa','inactiva'], default: 'activa' },
}, { timestamps: true });

module.exports = mongoose.model('Seccion', seccionSchema);
