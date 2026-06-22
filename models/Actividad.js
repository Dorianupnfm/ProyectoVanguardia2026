// models/Actividad.js
// Actividad evaluativa dentro de un parcial
const mongoose = require('mongoose');

const COMPONENTES = ['AA','AEA','VA','EADH','E-EP'];
const COMPONENTE_NOMBRES = {
  'AA':   'Actividades de Aula',
  'AEA':  'Actividades Extra Aula',
  'VA':   'Valores y Actitudes',
  'EADH': 'Expresiones Artísticas, Deportivas y Humanísticas',
  'E-EP': 'Examen Escrito o Práctico',
};
// Peso porcentual estándar de cada componente sobre la Nota Final (suma 100)
const COMPONENTE_PESOS = {
  'AA':   25,
  'AEA':  10,
  'VA':   10,
  'EADH': 5,
  'E-EP': 50,
};

const actividadSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  componente:  { type: String, enum: COMPONENTES, required: true },
  asignatura:  { type: mongoose.Schema.Types.ObjectId, ref: 'Asignatura', required: true },
  parcial:     { type: mongoose.Schema.Types.ObjectId, ref: 'Parcial',    required: true },
  seccion:     { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion',    required: true },
  puntajeMax:  { type: Number, required: true, min: 1, max: 100, default: 10 },
  fecha:       { type: Date, default: Date.now },
  descripcion: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Actividad', actividadSchema);
module.exports.COMPONENTES = COMPONENTES;
module.exports.COMPONENTE_NOMBRES = COMPONENTE_NOMBRES;
module.exports.COMPONENTE_PESOS = COMPONENTE_PESOS;
