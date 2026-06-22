// models/Padre.js — Padre, madre o encargado del estudiante
const mongoose = require('mongoose');

const padreSchema = new mongoose.Schema({
  nombre:        { type: String, required: true, trim: true },
  apellido:      { type: String, required: true, trim: true },
  numIdentidad:  { type: String, trim: true, default: '' },
  parentesco:    { type: String, enum: ['padre','madre','tutor','otro'], default: 'padre' },
  telefono:      { type: String, trim: true, default: '' },
  correo:        { type: String, lowercase: true, trim: true, default: '' },
  direccion:     { type: String, trim: true, default: '' },
  ocupacion:     { type: String, trim: true, default: '' },
  // El vínculo con sus hijos vive en Matricula.padre — un padre puede
  // tener varios hijos matriculados sin necesidad de mantener la lista aquí.
  // La contraseña de acceso del padre se consulta en pantalla (no se
  // envía por correo) desde Usuario.verPasswordReal() vía /usuarios/:id/ver-password.
  usuario:       { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  estado:        { type: String, enum: ['activo','inactivo'], default: 'activo' },
}, { timestamps: true });

module.exports = mongoose.model('Padre', padreSchema);
