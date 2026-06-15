// models/Parcial.js
const mongoose = require('mongoose');

const parcialSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true }, // "I Parcial"
  numero:      { type: Number, required: true },              // 1,2,3,4
  anioEscolar: { type: Number, required: true },
  fechaInicio: { type: Date, default: null },
  fechaFin:    { type: Date, default: null },
  estado:      { type: String, enum: ['pendiente','activo','cerrado'], default: 'pendiente' },
}, { timestamps: true });

module.exports = mongoose.model('Parcial', parcialSchema);
