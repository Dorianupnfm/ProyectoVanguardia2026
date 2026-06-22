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
    foto: {
      type: String, // URL o base64 de la fotografía del estudiante
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
    // CAMPOS LEGADO — ya no se llenan al crear/editar un alumno.
    // La fuente real de grado/sección/jornada es la Matrícula activa
    // del alumno (Matricula.seccion → Seccion.grado / Seccion.jornada).
    // Se conservan en el schema solo por compatibilidad con registros
    // antiguos; no usarlos para lógica nueva.
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
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alumno', alumnoSchema);
