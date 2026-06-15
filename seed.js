// seed.js — Datos completos de prueba para SoftWork
// Ejecutar: node seed.js

require('dotenv').config();
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const Usuario    = require('./models/Usuario');
const Carrera    = require('./models/Carrera');
const Grado      = require('./models/Grado');
const Seccion    = require('./models/Seccion');
const Docente    = require('./models/Docente');
const Asignatura = require('./models/Asignatura');
const Alumno     = require('./models/Alumno');
const Matricula  = require('./models/Matricula');
const Parcial    = require('./models/Parcial');
const Actividad  = require('./models/Actividad');
const Nota       = require('./models/Nota');
const Configuracion = require('./models/Configuracion');

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB...\n');

  // Limpiar colecciones
  await Promise.all([
    Usuario.deleteMany({}), Carrera.deleteMany({}),
    Grado.deleteMany({}), Seccion.deleteMany({}),
    Docente.deleteMany({}), Asignatura.deleteMany({}),
    Alumno.deleteMany({}), Matricula.deleteMany({}),
    Parcial.deleteMany({}), Actividad.deleteMany({}),
    Nota.deleteMany({}), Configuracion.deleteMany({}),
  ]);
  console.log('Colecciones limpiadas');

  // ─── USUARIOS ────────────────────────────────────────────────────────
  await Usuario.create([
    { nombre: 'Carlos Mendoza',   email: 'director@softwork.com',     password: 'Dir2025!',   rol: 'director' },
    { nombre: 'Rosa Suazo',       email: 'subdirector@softwork.com',  password: 'Sub2025!',   rol: 'subdirector' },
    { nombre: 'Ana Pineda',       email: 'admin@softwork.com',        password: 'Admin2025',  rol: 'administrativo' },
    { nombre: 'Carmen Reyes',     email: 'secretaria@softwork.com',   password: 'Sec2025!',   rol: 'secretario' },
    { nombre: 'Pedro Lagos',      email: 'consejero@softwork.com',    password: 'Con2025!',   rol: 'consejero' },
    { nombre: 'Mario Hernández',  email: 'mario@softwork.com',        password: 'Doc2025!',   rol: 'docente' },
  ]);
  console.log('Usuarios creados (6)');

  // ─── CARRERAS ────────────────────────────────────────────────────────
  const [bachComp, bachCon, bachCien] = await Carrera.create([
    { nombre: 'Bachillerato Técnico en Computación',         codigo: 'BTC',  duracion: 3, descripcion: 'Formación en tecnología e informática' },
    { nombre: 'Bachillerato en Ciencias y Letras',           codigo: 'BCL',  duracion: 3, descripcion: 'Formación académica general' },
    { nombre: 'Bachillerato Técnico en Administración',      codigo: 'BTA',  duracion: 3, descripcion: 'Formación en negocios y administración' },
  ]);
  console.log('Carreras creadas (3)');

  // ─── DOCENTES ────────────────────────────────────────────────────────
  const [dMario, dAna, dCarlos, dLuisa, dPedro] = await Docente.create([
    { nombre: 'Mario',  apellido: 'Hernández López', numIdentidad: '0801-1980-12345', correo: 'mario.hernandez@inst.hn',  telefono: '9912-3456', especialidad: 'Matemáticas',           titulo: 'Profesor de Educación Media',        fechaIngreso: new Date('2015-01-15') },
    { nombre: 'Ana',    apellido: 'Martínez Flores', numIdentidad: '0801-1982-23456', correo: 'ana.martinez@inst.hn',    telefono: '9923-4567', especialidad: 'Español y Literatura',    titulo: 'Licenciada en Letras',               fechaIngreso: new Date('2016-02-01') },
    { nombre: 'Carlos', apellido: 'Paz Medina',      numIdentidad: '0801-1978-34567', correo: 'carlos.paz@inst.hn',      telefono: '9934-5678', especialidad: 'Informática',             titulo: 'Ingeniero en Sistemas',              fechaIngreso: new Date('2017-03-10') },
    { nombre: 'Luisa',  apellido: 'Aguilar Romero',  numIdentidad: '0801-1985-45678', correo: 'luisa.aguilar@inst.hn',   telefono: '9945-6789', especialidad: 'Ciencias Naturales',     titulo: 'Licenciada en Biología',             fechaIngreso: new Date('2018-01-20') },
    { nombre: 'Pedro',  apellido: 'Villeda Cruz',    numIdentidad: '0801-1983-56789', correo: 'pedro.villeda@inst.hn',   telefono: '9956-7890', especialidad: 'Ciencias Sociales',      titulo: 'Licenciado en Historia',             fechaIngreso: new Date('2019-08-05') },
  ]);
  console.log('Docentes creados (5)');

  // Vincular usuario docente con su registro de Docente
  const usuarioMario = await Usuario.findOne({ email: 'mario@softwork.com' });
  if (usuarioMario) {
    await Docente.findByIdAndUpdate(dMario._id, { usuario: usuarioMario._id });
    console.log('Usuario mario@softwork.com vinculado con Docente Mario Hernández');
  }

  // ─── GRADOS ─────────────────────────────────────────────────────────
  const anio = 2025;
  const [g7comp, g8comp, g9comp, g10comp, g10con, g7bcl, g8bcl] = await Grado.create([
    // Ciclo Básico — sin carrera, plan común
    { nombre: '7° Grado', numero: 7, anioEscolar: anio, nivel: 'ciclo-basico', carrera: null },
    { nombre: '8° Grado', numero: 8, anioEscolar: anio, nivel: 'ciclo-basico', carrera: null },
    { nombre: '9° Grado', numero: 9, anioEscolar: anio, nivel: 'ciclo-basico', carrera: null },
    // Bachillerato — con carrera elegida
    { nombre: '10° Grado', numero: 10, anioEscolar: anio, nivel: 'bachillerato', carrera: bachComp._id },
    { nombre: '10° Grado', numero: 10, anioEscolar: anio, nivel: 'bachillerato', carrera: bachCon._id  },
    { nombre: '7° Grado',  numero: 7,  anioEscolar: anio, nivel: 'ciclo-basico', carrera: null },
    { nombre: '8° Grado',  numero: 8,  anioEscolar: anio, nivel: 'ciclo-basico', carrera: null },
  ]);
  console.log('Grados creados (5)');

  // ─── SECCIONES ───────────────────────────────────────────────────────
  const [s7cA, s7cB, s8cA, s9cA, s7bA] = await Seccion.create([
    { nombre: 'A', grado: g7comp._id, docente: dMario._id, jornada: 'matutina',   capacidad: 35 },
    { nombre: 'B', grado: g7comp._id, docente: dAna._id,   jornada: 'vespertina', capacidad: 35 },
    { nombre: 'A', grado: g8comp._id, docente: dCarlos._id, jornada: 'matutina',  capacidad: 35 },
    { nombre: 'A', grado: g9comp._id, docente: dLuisa._id, jornada: 'matutina',   capacidad: 35 },
    { nombre: 'A', grado: g7bcl._id,  docente: dPedro._id, jornada: 'matutina',   capacidad: 40 },
  ]);
  console.log('Secciones creadas (5)');

  // ─── ASIGNATURAS ─────────────────────────────────────────────────────
  await Asignatura.create([
    { nombre: 'Matemáticas',            codigo: 'MAT', grado: g7comp._id, docente: dMario._id,  horasSemana: 5 },
    { nombre: 'Español',                codigo: 'ESP', grado: g7comp._id, docente: dAna._id,    horasSemana: 4 },
    { nombre: 'Informática Básica',     codigo: 'INF', grado: g7comp._id, docente: dCarlos._id, horasSemana: 4 },
    { nombre: 'Ciencias Naturales',     codigo: 'CNA', grado: g7comp._id, docente: dLuisa._id,  horasSemana: 3 },
    { nombre: 'Ciencias Sociales',      codigo: 'CSO', grado: g7comp._id, docente: dPedro._id,  horasSemana: 3 },
    { nombre: 'Matemáticas',            codigo: 'MAT', grado: g8comp._id, docente: dMario._id,  horasSemana: 5 },
    { nombre: 'Español',                codigo: 'ESP', grado: g8comp._id, docente: dAna._id,    horasSemana: 4 },
    { nombre: 'Programación I',         codigo: 'PRG', grado: g8comp._id, docente: dCarlos._id, horasSemana: 5 },
    { nombre: 'Bases de Datos',         codigo: 'BDD', grado: g9comp._id, docente: dCarlos._id, horasSemana: 4 },
    { nombre: 'Programación II',        codigo: 'PR2', grado: g9comp._id, docente: dCarlos._id, horasSemana: 5 },
  ]);
  console.log('Asignaturas creadas (10)');

  // ─── ALUMNOS ─────────────────────────────────────────────────────────
  const alumnos = await Alumno.create([
    // 7° Comp Sección A
    { expediente:'EXP-2025-0001', nombre:'Carlos',    apellido:'Mendoza López',    numIdentidad:'0801-2009-10001', fechaNacimiento:new Date('2009-03-15'), genero:'M', correo:'carlos.m@gmail.com',  telefono:'9901-2345', direccion:'Col. Kennedy, Tegucigalpa',       grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Roberto Mendoza',    telefonoTutor:'9911-2233' },
    { expediente:'EXP-2025-0002', nombre:'María',     apellido:'Rodríguez Soto',   numIdentidad:'0801-2009-10002', fechaNacimiento:new Date('2009-07-22'), genero:'F', correo:'maria.r@gmail.com',   telefono:'9902-3456', direccion:'Col. Palmira, Tegucigalpa',       grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Elena Soto',         telefonoTutor:'9922-3344' },
    { expediente:'EXP-2025-0003', nombre:'José',      apellido:'Torres Díaz',      numIdentidad:'0801-2009-10003', fechaNacimiento:new Date('2009-11-08'), genero:'M', correo:'jose.t@gmail.com',    telefono:'9903-4567', direccion:'Res. Los Laureles, Tegucigalpa',  grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Ana Díaz',           telefonoTutor:'9933-4455' },
    { expediente:'EXP-2025-0004', nombre:'Luisa',     apellido:'Aguilar Reyes',    numIdentidad:'0801-2009-10004', fechaNacimiento:new Date('2009-05-30'), genero:'F', correo:'luisa.a@gmail.com',   telefono:'9904-5678', direccion:'Col. Lomas del Guijarro, Teg.',   grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Fernando Aguilar',   telefonoTutor:'9944-5566' },
    { expediente:'EXP-2025-0005', nombre:'Diego',     apellido:'Mejía Castillo',   numIdentidad:'0801-2009-10005', fechaNacimiento:new Date('2009-01-14'), genero:'M', correo:'diego.m@gmail.com',   telefono:'9905-6789', direccion:'Barrio El Manchén, Tegucigalpa',  grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Carmen Castillo',    telefonoTutor:'9955-6677' },
    // 7° Comp Sección B
    { expediente:'EXP-2025-0006', nombre:'Sofía',     apellido:'Vargas Morales',   numIdentidad:'0801-2009-10006', fechaNacimiento:new Date('2009-09-20'), genero:'F', correo:'sofia.v@gmail.com',   telefono:'9906-7890', direccion:'Col. Florencia Norte, Teg.',     grado:'7° Grado', seccion:'B', jornada:'vespertina', nombreTutor:'Laura Morales',      telefonoTutor:'9966-7788' },
    { expediente:'EXP-2025-0007', nombre:'Andrés',    apellido:'Cruz Pineda',      numIdentidad:'0801-2009-10007', fechaNacimiento:new Date('2009-04-05'), genero:'M', correo:'andres.c@gmail.com',  telefono:'9907-8901', direccion:'Col. Alameda, Tegucigalpa',       grado:'7° Grado', seccion:'B', jornada:'vespertina', nombreTutor:'Jorge Cruz',         telefonoTutor:'9977-8899' },
    { expediente:'EXP-2025-0008', nombre:'Valentina', apellido:'Ordóñez Vásquez',  numIdentidad:'0801-2009-10008', fechaNacimiento:new Date('2009-12-18'), genero:'F', correo:'vale.o@gmail.com',    telefono:'9908-9012', direccion:'Res. Próceres, San Pedro Sula',   grado:'7° Grado', seccion:'B', jornada:'vespertina', nombreTutor:'Mariana Vásquez',    telefonoTutor:'9988-9900' },
    // 8° Comp Sección A
    { expediente:'EXP-2025-0009', nombre:'Roberto',   apellido:'Lara Suazo',       numIdentidad:'0801-2008-20001', fechaNacimiento:new Date('2008-06-12'), genero:'M', correo:'roberto.l@gmail.com', telefono:'9909-0123', direccion:'Col. Trejo, Tegucigalpa',         grado:'8° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Miguel Lara',        telefonoTutor:'9901-1122' },
    { expediente:'EXP-2025-0010', nombre:'Isabella',  apellido:'Núñez Padilla',    numIdentidad:'0801-2008-20002', fechaNacimiento:new Date('2008-02-28'), genero:'F', correo:'isabella.n@gmail.com',telefono:'9910-1234', direccion:'Col. Santa Fe, Comayagüela',     grado:'8° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Rosa Padilla',       telefonoTutor:'9902-2233' },
    { expediente:'EXP-2025-0011', nombre:'Santiago',  apellido:'Flores Meza',      numIdentidad:'0801-2008-20003', fechaNacimiento:new Date('2008-10-10'), genero:'M', correo:'santiago.f@gmail.com',telefono:'9911-2345', direccion:'Col. Las Minitas, Tegucigalpa',  grado:'8° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Patricia Meza',      telefonoTutor:'9903-3344' },
    // 9° Comp Sección A
    { expediente:'EXP-2025-0012', nombre:'Daniela',   apellido:'Espinoza Rivera',  numIdentidad:'0801-2007-30001', fechaNacimiento:new Date('2007-08-25'), genero:'F', correo:'daniela.e@gmail.com', telefono:'9912-3456', direccion:'Col. Rubén Darío, Tegucigalpa',  grado:'9° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Héctor Espinoza',    telefonoTutor:'9904-4455' },
    { expediente:'EXP-2025-0013', nombre:'Alejandro', apellido:'Gutiérrez Paz',    numIdentidad:'0801-2007-30002', fechaNacimiento:new Date('2007-03-17'), genero:'M', correo:'alex.g@gmail.com',    telefono:'9913-4567', direccion:'Res. El Pedregal, Tegucigalpa',   grado:'9° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Gloria Paz',         telefonoTutor:'9905-5566' },
    // 7° BCL Sección A
    { expediente:'EXP-2025-0014', nombre:'Camila',    apellido:'Santos Herrera',   numIdentidad:'0801-2009-10014', fechaNacimiento:new Date('2009-11-30'), genero:'F', correo:'camila.s@gmail.com',  telefono:'9914-5678', direccion:'Col. Las Vegas, Tegucigalpa',     grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Pablo Santos',       telefonoTutor:'9906-6677' },
    { expediente:'EXP-2025-0015', nombre:'Emilio',    apellido:'Castellanos Baca', numIdentidad:'0801-2009-10015', fechaNacimiento:new Date('2009-07-04'), genero:'M', correo:'emilio.c@gmail.com',  telefono:'9915-6789', direccion:'Col. Miraflores, San Pedro Sula', grado:'7° Grado', seccion:'A', jornada:'matutina',   nombreTutor:'Ricardo Baca',       telefonoTutor:'9907-7788' },
  ]);
  console.log(`Alumnos creados (${alumnos.length})`);

  // ─── MATRÍCULAS ───────────────────────────────────────────────────────
  const seccMap = {
    '7° Grado-A-matutina':   s7cA._id,
    '7° Grado-B-vespertina': s7cB._id,
    '8° Grado-A-matutina':   s8cA._id,
    '9° Grado-A-matutina':   s9cA._id,
  };

  const matDatos = alumnos.map((a, i) => {
    const key = `${a.grado}-${a.seccion}-${a.jornada}`;
    const secId = seccMap[key] || s7bA._id;
    return {
      numMatricula:   `MAT-2025-${String(i+1).padStart(4,'0')}`,
      alumno:         a._id,
      seccion:        secId,
      anioEscolar:    anio,
      fechaMatricula: new Date(`2025-01-${String(13 + (i % 5)).padStart(2,'0')}`),
      estado:         'activa',
    };
  });

  await Matricula.insertMany(matDatos);
  console.log(`Matrículas creadas (${matDatos.length})`);

  // ─── RESUMEN ──────────────────────────────────────────────────────────

  // ─── PARCIALES ───────────────────────────────────────────────────────
  const [p1, p2] = await Parcial.create([
    { nombre: 'I Parcial',  numero: 1, anioEscolar: anio, estado: 'cerrado',
      fechaInicio: new Date(`${anio}-01-15`), fechaFin: new Date(`${anio}-03-31`) },
    { nombre: 'II Parcial', numero: 2, anioEscolar: anio, estado: 'activo',
      fechaInicio: new Date(`${anio}-04-01`), fechaFin: new Date(`${anio}-06-30`) },
    { nombre: 'III Parcial',numero: 3, anioEscolar: anio, estado: 'pendiente',
      fechaInicio: new Date(`${anio}-07-01`), fechaFin: new Date(`${anio}-09-30`) },
    { nombre: 'IV Parcial', numero: 4, anioEscolar: anio, estado: 'pendiente',
      fechaInicio: new Date(`${anio}-10-01`), fechaFin: new Date(`${anio}-11-30`) },
  ]);
  console.log('Parciales creados (4)');

  // ─── CONFIGURACIÓN INSTITUCIONAL ─────────────────────────────────────
  await Configuracion.insertMany([
    { clave: 'inst_nombre',    valor: 'Instituto Nacional Simón Bolívar',  tipo: 'texto' },
    { clave: 'inst_direccion', valor: 'Col. Kennedy, Tegucigalpa, M.D.C.', tipo: 'texto' },
    { clave: 'inst_telefono',  valor: '(504) 2234-5678',                   tipo: 'texto' },
    { clave: 'inst_email',     valor: 'info@insb.edu.hn',                  tipo: 'email' },
    { clave: 'inst_codigo',    valor: '01-02-00123',                       tipo: 'texto' },
    { clave: 'inst_modalidad', valor: 'Educación Secundaria',               tipo: 'texto' },
    { clave: 'anio_lectivo',   valor: String(anio),                        tipo: 'numero' },
    { clave: 'nota_minima',    valor: '60',                                tipo: 'numero' },
  ]);
  console.log('Configuración institucional cargada');

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  DATOS DE PRUEBA CARGADOS CORRECTAMENTE');
  console.log('══════════════════════════════════════════════════════');
  console.log('\n  USUARIOS DE ACCESO:');
  console.log('  ┌─────────────────────────────────┬──────────────┬─────────────┐');
  console.log('  │ Correo                          │ Contraseña   │ Rol         │');
  console.log('  ├─────────────────────────────────┼──────────────┼─────────────┤');
  console.log('  │ director@softwork.com           │ Dir2025!     │ Director    │');
  console.log('  │ subdirector@softwork.com        │ Sub2025!     │ Subdirector │');
  console.log('  │ admin@softwork.com              │ Admin2025    │ Administrat.│');
  console.log('  │ secretaria@softwork.com         │ Sec2025!     │ Secretario  │');
  console.log('  │ consejero@softwork.com          │ Con2025!     │ Consejero   │');
  console.log('  │ mario@softwork.com              │ Doc2025!     │ Docente     │');
  console.log('  └─────────────────────────────────┴──────────────┴─────────────┘');
  console.log('\n  DATOS ACADÉMICOS:');
  console.log('  - 3 Carreras     - 7 Grados        - 5 Secciones');
  console.log('  - 5 Docentes     - 10 Asignaturas  - 15 Alumnos');
  console.log('  - 15 Matrículas  - 4 Parciales     - Config. institucional');
  console.log('══════════════════════════════════════════════════════\n');

  process.exit(0);
};

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
