// models/Grado.js
const mongoose = require('mongoose');

const gradoSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  numero:      { type: Number, default: null }, // 7, 8, 9, 10, 11, 12...
  anioEscolar: { type: Number, required: true, default: () => new Date().getFullYear() },
  nivel: {
    type: String,
    enum: ['ciclo-basico', 'bachillerato'],
    default: 'ciclo-basico',
  },
  carrera:  { type: mongoose.Schema.Types.ObjectId, ref: 'Carrera', default: null },
  estado:   { type: String, enum: ['activo','inactivo'], default: 'activo' },
}, { timestamps: true });

// Antes de guardar: detectar nivel automáticamente según el número de grado
gradoSchema.pre('save', function(next) {
  this._detectarNivel();
  next();
});
gradoSchema.pre('findOneAndUpdate', function(next) {
  const upd = this.getUpdate();
  if (upd.nombre) {
    const num = parseInt(upd.nombre);
    if (!isNaN(num)) {
      upd.numero = num;
      upd.nivel  = num <= 9 ? 'ciclo-basico' : 'bachillerato';
      if (num <= 9) upd.carrera = null; // Ciclo básico no tiene carrera
    }
  }
  next();
});
gradoSchema.methods._detectarNivel = function() {
  const num = parseInt(this.nombre);
  if (!isNaN(num)) {
    this.numero = num;
    this.nivel  = num <= 9 ? 'ciclo-basico' : 'bachillerato';
    if (num <= 9) this.carrera = null;
  }
};

module.exports = mongoose.model('Grado', gradoSchema);
