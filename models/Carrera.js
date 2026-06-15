// models/Carrera.js
const mongoose = require('mongoose');

const carreraSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true, unique: true },
  codigo:      { type: String, trim: true, default: '' },
  descripcion: { type: String, trim: true, default: '' },
  duracion:    { type: Number, default: 3 }, // años
  estado:      { type: String, enum: ['activa','inactiva'], default: 'activa' },
}, { timestamps: true });

module.exports = mongoose.model('Carrera', carreraSchema);
