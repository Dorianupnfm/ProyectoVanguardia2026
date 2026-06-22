// models/Docente.js
const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  nombre:        { type: String, required: true, trim: true },
  apellido:      { type: String, required: true, trim: true },
  numIdentidad:  { type: String, trim: true, default: '' },
  correo:        { type: String, lowercase: true, trim: true, default: '' },
  telefono:      { type: String, trim: true, default: '' },
  direccion:     { type: String, trim: true, default: '' },
  especialidad:  { type: String, trim: true, default: '' },
  titulo:        { type: String, trim: true, default: '' },
  tipoContrato:  {
    type: String,
    enum: ['tiempo-completo','medio-tiempo','por-hora','interino'],
    default: 'tiempo-completo',
  },
  fechaIngreso:  { type: Date, default: null },
  estado: {
    type: String,
    enum: ['activo','inactivo','retirado'],
    default: 'activo',
  },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Docente', docenteSchema);
