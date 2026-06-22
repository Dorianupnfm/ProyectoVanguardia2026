// models/Usuario.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

// ── Cifrado reversible AES-256 para que el Director pueda consultar
//    la contraseña en texto plano cuando lo necesite. La clave sale
//    de SESSION_SECRET (ya definida en .env) para no agregar otra var.
const ALGO = 'aes-256-cbc';
const KEY  = crypto.createHash('sha256').update(String(process.env.SESSION_SECRET || 'softwork_clave')).digest();

const cifrar = (texto) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
};

const descifrar = (textoCifrado) => {
  try {
    const [ivHex, dataHex] = textoCifrado.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return dec.toString('utf8');
  } catch (e) { return null; }
};

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
  // Copia cifrada (reversible) de la contraseña en texto plano —
  // únicamente para que el Director pueda consultarla desde Usuarios.
  passwordVisible: { type: String, default: null, select: false },
  rol: {
    type: String,
    enum: ['director','subdirector','administrativo','secretario','consejero','docente','padre','estudiante'],
    default: 'secretario',
  },
  estado: { type: String, enum: ['activo','inactivo'], default: 'activo' },
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta:   { type: Date,   default: null },
}, { timestamps: true });

usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  // Guardar copia cifrada reversible ANTES de hashear
  this.passwordVisible = cifrar(this.password);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Obtener la contraseña real (solo para uso del Director) ─────────
usuarioSchema.methods.verPasswordReal = function() {
  if (!this.passwordVisible) return null;
  return descifrar(this.passwordVisible);
};

usuarioSchema.methods.compararPassword = async function(ingresado) {
  return bcrypt.compare(ingresado, this.password);
};

usuarioSchema.methods.estaBloqueado = function() {
  if (!this.bloqueadoHasta) return false;
  return new Date() < this.bloqueadoHasta;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
