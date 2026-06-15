// models/Alumno.js
// Modelo Mongoose para alumnos del centro educativo

const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema(
  {
    expediente: {
      type: String,
      required: [true, 'El expediente es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },
    numIdentidad: {
      type: String,
      trim: true,
      default: '',
    },
    fechaNacimiento: {
      type: Date,
      default: null,
    },
    genero: {
      type: String,
      enum: ['M', 'F', ''],
      default: '',
    },
    correo: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    telefono: {
      type: String,
      trim: true,
      default: '',
    },
    direccion: {
      type: String,
      trim: true,
      default: '',
    },
    grado: {
      type: String,
      trim: true,
      default: '',
    },
    seccion: {
      type: String,
      trim: true,
      default: '',
    },
    jornada: {
      type: String,
      enum: ['matutina', 'vespertina', 'nocturna'],
      default: 'matutina',
    },
    nombreTutor: {
      type: String,
      trim: true,
      default: '',
    },
    telefonoTutor: {
      type: String,
      trim: true,
      default: '',
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo', 'retirado', 'egresado'],
      default: 'activo',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alumno', alumnoSchema);
