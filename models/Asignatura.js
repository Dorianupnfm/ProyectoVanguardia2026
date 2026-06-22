// models/Asignatura.js
const mongoose = require('mongoose');

const asignaturaSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true },
  codigo:   { type: String, trim: true, default: '' },
  grado:    { type: mongoose.Schema.Types.ObjectId, ref: 'Grado', required: true },
  docente:  { type: mongoose.Schema.Types.ObjectId, ref: 'Docente', default: null },
  horasSemana: { type: Number, default: 4 },
  estado:   { type: String, enum: ['activa','inactiva'], default: 'activa' },
}, { timestamps: true });

module.exports = mongoose.model('Asignatura', asignaturaSchema);
