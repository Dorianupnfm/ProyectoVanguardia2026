// app.js — Punto de entrada SoftWork Node.js
require('dotenv').config();

const express      = require('express');
const session      = require('express-session');
const flash        = require('connect-flash');
const path         = require('path');
const conectarDB   = require('./config/db');
const { pasarUsuario } = require('./middleware/auth');

const app = express();
conectarDB();

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'softwork2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 }, // 4 horas
}));
app.use(flash());
app.use(pasarUsuario);

// Rutas
app.use('/auth',        require('./routes/auth'));
app.use('/alumnos',     require('./routes/alumnos'));
app.use('/docentes',    require('./routes/docentes'));
app.use('/carreras',    require('./routes/carreras'));
app.use('/grados',      require('./routes/grados'));
app.use('/secciones',   require('./routes/secciones'));
app.use('/asignaturas', require('./routes/asignaturas'));
app.use('/matriculas',  require('./routes/matriculas'));
app.use('/usuarios',    require('./routes/usuarios'));
app.use('/docente',       require('./routes/docente'));
app.use('/asistencia',    require('./routes/asistencia'));
app.use('/notas',         require('./routes/notas'));
app.use('/reportes',      require('./routes/reportes'));
app.use('/configuracion', require('./routes/configuracion'));

// Raíz
app.get('/', (req, res) => res.redirect('/auth/login'));

// Dashboard con estadísticas
app.get('/dashboard', async (req, res) => {
  if (!req.session.usuarioId) return res.redirect('/auth/login');
  // Docentes van a su portal propio
  const rol = req.session.usuario?.rol;
  if (rol === 'docente') return res.redirect('/docente');
  // Consejero y secretario van al dashboard con vista limitada
  // Director, subdirector, administrativo van al dashboard completo
  try {
    const [Alumno, Docente, Matricula, Carrera] = [
      require('./models/Alumno'), require('./models/Docente'),
      require('./models/Matricula'), require('./models/Carrera'),
    ];
    const anio = new Date().getFullYear();
    const [totalAlumnos, totalDocentes, totalMatriculas, totalCarreras] = await Promise.all([
      Alumno.countDocuments({ estado: 'activo' }),
      Docente.countDocuments({ estado: 'activo' }),
      Matricula.countDocuments({ anioEscolar: anio, estado: 'activa' }),
      Carrera.countDocuments({ estado: 'activa' }),
    ]);
    res.render('dashboard', { titulo: 'Dashboard', totalAlumnos, totalDocentes, totalMatriculas, totalCarreras, anio });
  } catch(e) {
    res.render('dashboard', { titulo: 'Dashboard', totalAlumnos: 0, totalDocentes: 0, totalMatriculas: 0, totalCarreras: 0, anio: new Date().getFullYear() });
  }
});

// 404
app.use((req, res) => res.status(404).render('404', { titulo: 'Página no encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/auth/login`);
});
