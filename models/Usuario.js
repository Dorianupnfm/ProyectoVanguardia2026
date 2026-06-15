// models/Usuario.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: [true,'El nombre es obligatorio'], trim: true },
  email: {
    type: String, required: [true,'El correo es obligatorio'],
    unique: true, lowercase: true, trim: true,
  },
  password: {
    type: String, required: [true,'La contraseña es obligatoria'],
    minlength: [6,'Mínimo 6 caracteres'],
  },
  rol: {
    type: String,
    enum: ['director','subdirector','administrativo','secretario','consejero','docente'],
    default: 'secretario',
  },
  estado: {
    type: String,
    enum: ['activo','inactivo'],
    default: 'activo',
  },
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta:   { type: Date,   default: null },
}, { timestamps: true });

// ── Encriptar password antes de guardar ────────────────────────────
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Comparar password ───────────────────────────────────────────────
usuarioSchema.methods.compararPassword = async function(ingresado) {
  return bcrypt.compare(ingresado, this.password);
};

// ── Verificar si está bloqueado ────────────────────────────────────
usuarioSchema.methods.estaBloqueado = function() {
  if (!this.bloqueadoHasta) return false;
  return new Date() < this.bloqueadoHasta;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
