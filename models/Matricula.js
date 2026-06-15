// models/Matricula.js
const mongoose = require('mongoose');

const matriculaSchema = new mongoose.Schema({
  numMatricula:   { type: String, unique: true, trim: true },
  alumno:         { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true },
  seccion:        { type: mongoose.Schema.Types.ObjectId, ref: 'Seccion', required: true },
  anioEscolar:    { type: Number, required: true, default: () => new Date().getFullYear() },
  fechaMatricula: { type: Date, default: Date.now },
  estado:         { type: String, enum: ['activa','anulada','trasladada'], default: 'activa' },
  observaciones:  { type: String, trim: true, default: '' },
}, { timestamps: true });

// Generar número de matrícula automático antes de guardar
matriculaSchema.pre('save', async function(next) {
  if (this.numMatricula) return next();
  const count = await mongoose.model('Matricula').countDocuments();
  this.numMatricula = `MAT-${this.anioEscolar}-${String(count + 1).padStart(4,'0')}`;
  next();
});

module.exports = mongoose.model('Matricula', matriculaSchema);
