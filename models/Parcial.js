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

parcialSchema.index({ anioEscolar: 1, numero: 1 }, { unique: true });

// Todo centro educativo trabaja con 4 parciales fijos por año lectivo.
// Esta función garantiza que existan, generándolos automáticamente
// la primera vez que se necesiten — sin que nadie tenga que crearlos a mano.
const NOMBRES = ['I Parcial', 'II Parcial', 'III Parcial', 'IV Parcial'];

parcialSchema.statics.asegurarParcialesDelAnio = async function (anioEscolar) {
  const existentes = await this.find({ anioEscolar }).sort({ numero: 1 });
  if (existentes.length === 4) return existentes;

  const faltantes = [];
  for (let numero = 1; numero <= 4; numero++) {
    if (!existentes.some(p => p.numero === numero)) {
      faltantes.push({ nombre: NOMBRES[numero - 1], numero, anioEscolar, estado: 'pendiente' });
    }
  }
  if (faltantes.length) {
    await this.insertMany(faltantes).catch(() => {}); // catch por si hay carrera entre requests simultáneos
  }
  return this.find({ anioEscolar }).sort({ numero: 1 });
};

module.exports = mongoose.model('Parcial', parcialSchema);
