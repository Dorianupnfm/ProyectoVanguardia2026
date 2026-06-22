// models/Configuracion.js
// Configuración institucional del centro educativo
const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true, trim: true },
  valor: { type: String, default: '' },
  tipo:  { type: String, enum: ['texto','numero','email','url','imagen'], default: 'texto' },
  descripcion: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Configuracion', configuracionSchema);
