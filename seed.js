// seed.js — Base de datos completa para pruebas — SoftWork V13
require('dotenv').config();
const mongoose     = require('mongoose');
const Usuario      = require('./models/Usuario');
const Carrera      = require('./models/Carrera');
const Grado        = require('./models/Grado');
const Seccion      = require('./models/Seccion');
const Docente      = require('./models/Docente');
const Asignatura   = require('./models/Asignatura');
const Alumno       = require('./models/Alumno');
const Matricula    = require('./models/Matricula');
const Parcial      = require('./models/Parcial');
const Actividad    = require('./models/Actividad');
const Nota         = require('./models/Nota');
const Asistencia   = require('./models/Asistencia');
const Configuracion= require('./models/Configuracion');
const Padre        = require('./models/Padre');

const rnd = (min, max) => Math.round((Math.random()*(max-min)+min)*10)/10;

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB...\n');

  await Promise.all([
    Usuario.deleteMany({}), Carrera.deleteMany({}), Grado.deleteMany({}),
    Seccion.deleteMany({}), Docente.deleteMany({}), Asignatura.deleteMany({}),
    Alumno.deleteMany({}), Matricula.deleteMany({}), Parcial.deleteMany({}),
    Actividad.deleteMany({}), Nota.deleteMany({}), Asistencia.deleteMany({}),
    Configuracion.deleteMany({}), Padre.deleteMany({}),
  ]);
  console.log('Colecciones limpiadas');

  const ANIO = 2025;

  // 1. CONFIGURACION
  await Configuracion.insertMany([
    { clave:'inst_nombre',    valor:'Instituto Nacional Simón Bolívar',          tipo:'texto'  },
    { clave:'inst_direccion', valor:'Col. Kennedy, Blvd. Morazán, Tegucigalpa',  tipo:'texto'  },
    { clave:'inst_telefono',  valor:'(504) 2234-5678',                           tipo:'texto'  },
    { clave:'inst_email',     valor:'info@insb.edu.hn',                          tipo:'email'  },
    { clave:'inst_codigo',    valor:'01-02-00123',                               tipo:'texto'  },
    { clave:'inst_modalidad', valor:'Educación Secundaria',                       tipo:'texto'  },
    { clave:'anio_lectivo',   valor:String(ANIO),                                tipo:'numero' },
    { clave:'nota_minima',    valor:'60',                                         tipo:'numero' },
  ]);
  console.log('Configuracion OK');

  // 2. USUARIOS
  await Usuario.create([
    { nombre:'Carlos Mendoza',  email:'director@softwork.com',    password:'Dir2025!',  rol:'director'       },
    { nombre:'Rosa Suazo',      email:'subdirector@softwork.com', password:'Sub2025!',  rol:'subdirector'    },
    { nombre:'Ana Pineda',      email:'admin@softwork.com',       password:'Admin2025', rol:'administrativo' },
    { nombre:'Carmen Reyes',    email:'secretaria@softwork.com',  password:'Sec2025!',  rol:'secretario'     },
    { nombre:'Pedro Lagos',     email:'consejero@softwork.com',   password:'Con2025!',  rol:'consejero'      },
    { nombre:'Mario Hernandez', email:'mario@softwork.com',       password:'Doc2025!',  rol:'docente'        },
    { nombre:'Ana Martinez',    email:'ana@softwork.com',         password:'Doc2025!',  rol:'docente'        },
    { nombre:'Carlos Paz',      email:'carlos@softwork.com',      password:'Doc2025!',  rol:'docente'        },
    { nombre:'Luisa Aguilar',   email:'luisa@softwork.com',       password:'Doc2025!',  rol:'docente'        },
    { nombre:'Pedro Villeda',   email:'pedro@softwork.com',       password:'Doc2025!',  rol:'docente'        },
  ]);
  console.log('Usuarios creados (10)');

  // 3. CARRERAS
  const [cBTC, cBCL, cBTA] = await Carrera.create([
    { nombre:'Bachillerato Tecnico en Computacion',    codigo:'BTC', duracion:3 },
    { nombre:'Bachillerato en Ciencias y Letras',      codigo:'BCL', duracion:3 },
    { nombre:'Bachillerato Tecnico en Administracion', codigo:'BTA', duracion:3 },
  ]);
  console.log('Carreras creadas (3)');

  // 4. DOCENTES
  const [uMario,uAna,uCarlos,uLuisa,uPedro] = await Promise.all([
    Usuario.findOne({email:'mario@softwork.com'}),
    Usuario.findOne({email:'ana@softwork.com'}),
    Usuario.findOne({email:'carlos@softwork.com'}),
    Usuario.findOne({email:'luisa@softwork.com'}),
    Usuario.findOne({email:'pedro@softwork.com'}),
  ]);

  const [dMario,dAna,dCarlos,dLuisa,dPedro] = await Docente.create([
    { nombre:'Mario',  apellido:'Hernandez Lopez',  numIdentidad:'0801-1980-12345', correo:'mario@insb.edu.hn',  telefono:'9912-3456', direccion:'Col. Kennedy, Teg.',        especialidad:'Matematicas',          titulo:'Profesor de Educacion Media',    tipoContrato:'tiempo-completo', fechaIngreso:new Date('2015-01-15'), usuario:uMario._id },
    { nombre:'Ana',    apellido:'Martinez Flores',  numIdentidad:'0801-1982-23456', correo:'ana@insb.edu.hn',    telefono:'9923-4567', direccion:'Res. Miraflores, Teg.',      especialidad:'Espanol y Literatura', titulo:'Licenciada en Letras',           tipoContrato:'tiempo-completo', fechaIngreso:new Date('2016-02-01'), usuario:uAna._id   },
    { nombre:'Carlos', apellido:'Paz Medina',       numIdentidad:'0801-1978-34567', correo:'carlos@insb.edu.hn', telefono:'9934-5678', direccion:'Col. Florencia Norte, Teg.', especialidad:'Informatica',           titulo:'Ingeniero en Sistemas',          tipoContrato:'tiempo-completo', fechaIngreso:new Date('2017-03-10'), usuario:uCarlos._id},
    { nombre:'Luisa',  apellido:'Aguilar Romero',   numIdentidad:'0801-1985-45678', correo:'luisa@insb.edu.hn',  telefono:'9945-6789', direccion:'Col. Alameda, Teg.',         especialidad:'Ciencias Naturales',   titulo:'Licenciada en Biologia',         tipoContrato:'medio-tiempo',    fechaIngreso:new Date('2018-01-20'), usuario:uLuisa._id },
    { nombre:'Pedro',  apellido:'Villeda Cruz',     numIdentidad:'0801-1983-56789', correo:'pedro@insb.edu.hn',  telefono:'9956-7890', direccion:'Col. Las Minitas, Teg.',     especialidad:'Ciencias Sociales',    titulo:'Licenciado en Ciencias Sociales',tipoContrato:'tiempo-completo', fechaIngreso:new Date('2019-08-05'), usuario:uPedro._id },
  ]);
  console.log('Docentes creados (5)');

  // 5. GRADOS
  const [g7,g8,g9,g10btc,g11btc,g10bcl,g10bta] = await Grado.create([
    { nombre:'7 Grado',  numero:7,  anioEscolar:ANIO, nivel:'ciclo-basico', carrera:null       },
    { nombre:'8 Grado',  numero:8,  anioEscolar:ANIO, nivel:'ciclo-basico', carrera:null       },
    { nombre:'9 Grado',  numero:9,  anioEscolar:ANIO, nivel:'ciclo-basico', carrera:null       },
    { nombre:'10 Grado', numero:10, anioEscolar:ANIO, nivel:'bachillerato', carrera:cBTC._id   },
    { nombre:'11 Grado', numero:11, anioEscolar:ANIO, nivel:'bachillerato', carrera:cBTC._id   },
    { nombre:'10 Grado', numero:10, anioEscolar:ANIO, nivel:'bachillerato', carrera:cBCL._id   },
    { nombre:'10 Grado', numero:10, anioEscolar:ANIO, nivel:'bachillerato', carrera:cBTA._id   },
  ]);
  console.log('Grados creados (7)');

  // 6. SECCIONES
  const [s7A,s7B,s8A,s9A,s10btcA,s10bclA,s10btaA] = await Seccion.create([
    { nombre:'A', grado:g7._id,     docente:dMario._id,  jornada:'matutina',   capacidad:35 },
    { nombre:'B', grado:g7._id,     docente:dAna._id,    jornada:'vespertina', capacidad:35 },
    { nombre:'A', grado:g8._id,     docente:dCarlos._id, jornada:'matutina',   capacidad:35 },
    { nombre:'A', grado:g9._id,     docente:dLuisa._id,  jornada:'matutina',   capacidad:35 },
    { nombre:'A', grado:g10btc._id, docente:dCarlos._id, jornada:'matutina',   capacidad:30 },
    { nombre:'A', grado:g10bcl._id, docente:dPedro._id,  jornada:'matutina',   capacidad:40 },
    { nombre:'A', grado:g10bta._id, docente:dAna._id,    jornada:'vespertina', capacidad:35 },
  ]);
  console.log('Secciones creadas (7)');

  // 7. ASIGNATURAS
  const [aMat7,aEsp7,aCna7,aCso7,aIng7,aEfi7] = await Asignatura.create([
    { nombre:'Matematicas',       codigo:'MAT7', grado:g7._id, docente:dMario._id,  horasSemana:5 },
    { nombre:'Espanol',           codigo:'ESP7', grado:g7._id, docente:dAna._id,    horasSemana:5 },
    { nombre:'Ciencias Naturales',codigo:'CNA7', grado:g7._id, docente:dLuisa._id,  horasSemana:4 },
    { nombre:'Ciencias Sociales', codigo:'CSO7', grado:g7._id, docente:dPedro._id,  horasSemana:4 },
    { nombre:'Ingles',            codigo:'ING7', grado:g7._id, docente:dAna._id,    horasSemana:3 },
    { nombre:'Ed. Fisica',        codigo:'EFI7', grado:g7._id, docente:dPedro._id,  horasSemana:2 },
  ]);
  const [aMat8,aEsp8,aCna8,aCso8,aTec8] = await Asignatura.create([
    { nombre:'Matematicas',       codigo:'MAT8', grado:g8._id, docente:dMario._id,  horasSemana:5 },
    { nombre:'Espanol',           codigo:'ESP8', grado:g8._id, docente:dAna._id,    horasSemana:5 },
    { nombre:'Ciencias Naturales',codigo:'CNA8', grado:g8._id, docente:dLuisa._id,  horasSemana:4 },
    { nombre:'Ciencias Sociales', codigo:'CSO8', grado:g8._id, docente:dPedro._id,  horasSemana:4 },
    { nombre:'Tecnologia',        codigo:'TEC8', grado:g8._id, docente:dCarlos._id, horasSemana:3 },
  ]);
  const [aPrg10,aRed10,aBD10,aMat10,aIng10] = await Asignatura.create([
    { nombre:'Programacion I',    codigo:'PRG1', grado:g10btc._id, docente:dCarlos._id, horasSemana:6 },
    { nombre:'Redes Informaticas',codigo:'RED1', grado:g10btc._id, docente:dCarlos._id, horasSemana:4 },
    { nombre:'Bases de Datos',    codigo:'BD01', grado:g10btc._id, docente:dCarlos._id, horasSemana:4 },
    { nombre:'Matematicas',       codigo:'MAT0', grado:g10btc._id, docente:dMario._id,  horasSemana:5 },
    { nombre:'Ingles Tecnico',    codigo:'ING0', grado:g10btc._id, docente:dAna._id,    horasSemana:3 },
  ]);
  console.log('Asignaturas creadas (16)');

  // 8. ALUMNOS (30)
  const rawAlumnos = [
    ['EXP-2025-0001','Carlos Alberto','Mendoza Lopez','0801-2009-10001','2009-03-15','M','carlos.m@gmail.com','9901-2345','Col. Kennedy, Teg.','7 Grado','A','matutina','Roberto Mendoza','9911-2233'],
    ['EXP-2025-0002','Maria Jose','Rodriguez Soto','0801-2009-10002','2009-07-22','F','maria.r@gmail.com','9902-3456','Col. Palmira, Teg.','7 Grado','A','matutina','Elena Soto','9922-3344'],
    ['EXP-2025-0003','Jose Manuel','Torres Diaz','0801-2009-10003','2009-11-08','M','jose.t@gmail.com','9903-4567','Res. Los Laureles, Teg.','7 Grado','A','matutina','Ana Diaz','9933-4455'],
    ['EXP-2025-0004','Luisa Fernanda','Aguilar Reyes','0801-2009-10004','2009-05-30','F','luisa.a@gmail.com','9904-5678','Col. Lomas del Guijarro','7 Grado','A','matutina','Fernando Aguilar','9944-5566'],
    ['EXP-2025-0005','Diego Alejandro','Mejia Castillo','0801-2009-10005','2009-01-14','M','diego.m@gmail.com','9905-6789','Barrio El Manchen, Teg.','7 Grado','A','matutina','Carmen Castillo','9955-6677'],
    ['EXP-2025-0006','Valentina','Ordonez Vasquez','0801-2009-10006','2009-12-03','F','vale.o@gmail.com','9906-7890','Res. Proceres, Teg.','7 Grado','A','matutina','Mariana Vasquez','9966-7788'],
    ['EXP-2025-0007','Roberto Carlos','Lara Suazo','0801-2009-10007','2009-08-19','M','roberto.l@gmail.com','9907-8901','Col. Trejo, Teg.','7 Grado','A','matutina','Miguel Lara','9977-8899'],
    ['EXP-2025-0008','Isabella','Nunez Padilla','0801-2009-10008','2009-04-25','F','isabella.n@gmail.com','9908-9012','Col. Santa Fe, Comayaguuela','7 Grado','A','matutina','Rosa Padilla','9988-9900'],
    ['EXP-2025-0009','Santiago','Flores Meza','0801-2009-10009','2009-09-11','M','santiago.f@gmail.com','9909-0123','Col. Las Minitas, Teg.','7 Grado','A','matutina','Patricia Meza','9901-1122'],
    ['EXP-2025-0010','Camila','Santos Herrera','0801-2009-10010','2009-06-17','F','camila.s@gmail.com','9910-1234','Col. Las Vegas, Teg.','7 Grado','A','matutina','Pablo Santos','9902-2233'],
    ['EXP-2025-0011','Sofia Alejandra','Vargas Morales','0801-2009-10011','2009-02-28','F','sofia.v@gmail.com','9911-2345','Col. Florencia Norte, Teg.','7 Grado','B','vespertina','Laura Morales','9903-3344'],
    ['EXP-2025-0012','Andres Felipe','Cruz Pineda','0801-2009-10012','2009-10-05','M','andres.c@gmail.com','9912-3456','Col. Alameda, Teg.','7 Grado','B','vespertina','Jorge Cruz','9904-4455'],
    ['EXP-2025-0013','Daniela','Espinoza Rivera','0801-2009-10013','2009-07-14','F','daniela.e@gmail.com','9913-4567','Col. Ruben Dario, Teg.','7 Grado','B','vespertina','Hector Espinoza','9905-5566'],
    ['EXP-2025-0014','Alejandro','Gutierrez Paz','0801-2009-10014','2009-03-22','M','alex.g@gmail.com','9914-5678','Res. El Pedregal, Teg.','7 Grado','B','vespertina','Gloria Paz','9906-6677'],
    ['EXP-2025-0015','Emilio','Castellanos Baca','0801-2009-10015','2009-11-30','M','emilio.c@gmail.com','9915-6789','Col. Miraflores, Teg.','7 Grado','B','vespertina','Ricardo Baca','9907-7788'],
    ['EXP-2025-0016','Mariana','Lopez Zelaya','0801-2009-10016','2009-05-08','F','mariana.l@gmail.com','9916-7890','Col. Villa Nueva, Teg.','7 Grado','B','vespertina','Oscar Lopez','9908-8899'],
    ['EXP-2025-0017','Kevin','Flores Reyes','0801-2009-10017','2009-08-19','M','kevin.f@gmail.com','9917-8901','Barrio La Granja, Teg.','7 Grado','B','vespertina','Sandra Reyes','9909-9900'],
    ['EXP-2025-0018','Paola','Mendez Turcios','0801-2009-10018','2009-01-31','F','paola.m@gmail.com','9918-9012','Col. Morazan, Teg.','7 Grado','B','vespertina','Julio Mendez','9910-0011'],
    ['EXP-2025-0019','Bryan','Amaya Suazo','0801-2008-20001','2008-04-12','M','bryan.a@gmail.com','9919-0123','Col. Villa Sol, Teg.','8 Grado','A','matutina','Ernesto Amaya','9911-1122'],
    ['EXP-2025-0020','Keila','Salgado Murillo','0801-2008-20002','2008-09-25','F','keila.s@gmail.com','9920-1234','Res. Los Pinos, Teg.','8 Grado','A','matutina','Ana Murillo','9912-2233'],
    ['EXP-2025-0021','Fernando','Amador Garcia','0801-2008-20003','2008-06-03','M','fernando.a@gmail.com','9921-2345','Col. San Miguel, Teg.','8 Grado','A','matutina','Rosa Garcia','9913-3344'],
    ['EXP-2025-0022','Genesis','Velasquez Lopez','0801-2008-20004','2008-12-18','F','genesis.v@gmail.com','9922-3456','Barrio La Travesia, Teg.','8 Grado','A','matutina','Carlos Velasquez','9914-4455'],
    ['EXP-2025-0023','Edwin','Martinez Cruz','0801-2008-20005','2008-03-07','M','edwin.m@gmail.com','9923-4567','Col. Palmira Sur, Teg.','8 Grado','A','matutina','Isabel Cruz','9915-5566'],
    ['EXP-2025-0024','Xiomara','Funez Lainez','0801-2008-20006','2008-07-29','F','xiomara.f@gmail.com','9924-5678','Col. Las Minitas, Teg.','8 Grado','A','matutina','Marco Funez','9916-6677'],
    ['EXP-2025-0025','Josue','Pineda Alvarez','0801-2008-20007','2008-10-14','M','josue.p@gmail.com','9925-6789','Col. Torocagua, Teg.','8 Grado','A','matutina','Blanca Alvarez','9917-7788'],
    ['EXP-2025-0026','Luis','Paz Rivera','0801-2007-30001','2007-05-20','M','luis.p@gmail.com','9926-7890','Col. Kennedy Sec. 3','10 Grado','A','matutina','Jorge Paz','9918-8899'],
    ['EXP-2025-0027','Andrea','Soto Membreno','0801-2007-30002','2007-02-14','F','andrea.s@gmail.com','9927-8901','Res. Los Robles, Teg.','10 Grado','A','matutina','Claudia Membreno','9919-9900'],
    ['EXP-2025-0028','Wilmer','Reconco Bautista','0801-2007-30003','2007-08-31','M','wilmer.r@gmail.com','9928-9012','Barrio Belen, Teg.','10 Grado','A','matutina','Santos Bautista','9920-0011'],
    ['EXP-2025-0029','Josselyn','Erazo Suarez','0801-2007-30004','2007-11-09','F','josselyn.e@gmail.com','9929-0123','Col. 21 de Octubre, Teg.','10 Grado','A','matutina','Marta Suarez','9921-1122'],
    ['EXP-2025-0030','Rudy','Lanza Discua','0801-2007-30005','2007-04-16','M','rudy.l@gmail.com','9930-1234','Col. Cerro Grande, Teg.','10 Grado','A','matutina','Norma Discua','9922-2233'],
  ];

  const alumnos = await Alumno.create(rawAlumnos.map(r => ({
    expediente:r[0],nombre:r[1],apellido:r[2],numIdentidad:r[3],
    fechaNacimiento:new Date(r[4]),genero:r[5],correo:r[6],telefono:r[7],
    direccion:r[8],grado:r[9],seccion:r[10],jornada:r[11],
    nombreTutor:r[12],telefonoTutor:r[13],estado:'activo',
  })));
  console.log('Alumnos creados (30)');

  // 9. PADRES DE FAMILIA (antes de matricular, para poder vincularlos)
  const uPadreRoberto = await Usuario.create({
    nombre: 'Roberto Mendoza', email: 'padre@softwork.com',
    password: 'Padre2025!', rol: 'padre',
  });
  const pRoberto = await Padre.create({
    nombre: 'Roberto', apellido: 'Mendoza',
    numIdentidad: '0801-1975-99001', parentesco: 'padre',
    telefono: '9911-2233', correo: 'padre@softwork.com',
    direccion: 'Col. Kennedy, Tegucigalpa', ocupacion: 'Ingeniero Civil',
    usuario: uPadreRoberto._id,
  });
  // Segundo padre sin cuenta de acceso (solo registro administrativo)
  const pElena = await Padre.create({
    nombre: 'Elena', apellido: 'Soto',
    numIdentidad: '0801-1978-99002', parentesco: 'madre',
    telefono: '9922-3344', correo: 'elena.soto@gmail.com',
    direccion: 'Col. Palmira, Tegucigalpa', ocupacion: 'Docente',
  });
  console.log('Padres de familia creados (2, uno con acceso al sistema)');

  // 10. MATRICULAS — el padre se vincula aqui, en el momento de matricular
  const secMap = {'7 Grado-A-matutina':s7A._id,'7 Grado-B-vespertina':s7B._id,'8 Grado-A-matutina':s8A._id,'10 Grado-A-matutina':s10btcA._id};
  // padreMap: alumnos[0] -> Roberto Mendoza (su padre real), alumnos[1] -> Elena Soto
  const padreMap = { 0: pRoberto._id, 1: pElena._id };
  const mats = await Matricula.insertMany(alumnos.map((al,i)=>({
    numMatricula:'MAT-2025-'+String(i+1).padStart(4,'0'),
    alumno:al._id,
    seccion:secMap[al.grado+'-'+al.seccion+'-'+al.jornada]||s7A._id,
    padre: padreMap[i] || null,
    anioEscolar:ANIO,
    fechaMatricula:new Date(ANIO+'-01-'+String(13+(i%5)).padStart(2,'0')),
    estado:i===4?'anulada':'activa',
  })));
  console.log('Matriculas creadas (30, 2 con encargado vinculado)');

  // 11. PARCIALES
  const [p1,p2,p3,p4] = await Parcial.create([
    { nombre:'I Parcial',   numero:1, anioEscolar:ANIO, estado:'cerrado',  fechaInicio:new Date(ANIO+'-01-15'), fechaFin:new Date(ANIO+'-03-28') },
    { nombre:'II Parcial',  numero:2, anioEscolar:ANIO, estado:'activo',   fechaInicio:new Date(ANIO+'-04-01'), fechaFin:new Date(ANIO+'-06-27') },
    { nombre:'III Parcial', numero:3, anioEscolar:ANIO, estado:'pendiente',fechaInicio:new Date(ANIO+'-07-07'), fechaFin:new Date(ANIO+'-09-26') },
    { nombre:'IV Parcial',  numero:4, anioEscolar:ANIO, estado:'pendiente',fechaInicio:new Date(ANIO+'-10-06'), fechaFin:new Date(ANIO+'-11-28') },
  ]);
  console.log('Parciales creados (4)');

  // 11. ACTIVIDADES
  const [aAA1,aAEA1,aVA1,aEP1] = await Actividad.create([
    { nombre:'Tarea 1 - Numeros Enteros',     componente:'AA',   asignatura:aMat7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:10, fecha:new Date(ANIO+'-02-05') },
    { nombre:'Proyecto - Ejercicios en casa', componente:'AEA',  asignatura:aMat7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:15, fecha:new Date(ANIO+'-02-20') },
    { nombre:'Comportamiento y participacion',componente:'VA',   asignatura:aMat7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:10, fecha:new Date(ANIO+'-03-01') },
    { nombre:'Examen I Parcial - Algebra',    componente:'E-EP', asignatura:aMat7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:40, fecha:new Date(ANIO+'-03-20') },
  ]);
  const [aAA2,aAEA2,aEP2] = await Actividad.create([
    { nombre:'Tarea 2 - Fracciones',          componente:'AA',   asignatura:aMat7._id, parcial:p2._id, seccion:s7A._id, puntajeMax:10, fecha:new Date(ANIO+'-04-15') },
    { nombre:'Investigacion - Historia Mat.',  componente:'AEA',  asignatura:aMat7._id, parcial:p2._id, seccion:s7A._id, puntajeMax:15, fecha:new Date(ANIO+'-05-10') },
    { nombre:'Prueba II Parcial',             componente:'E-EP', asignatura:aMat7._id, parcial:p2._id, seccion:s7A._id, puntajeMax:40, fecha:new Date(ANIO+'-06-15') },
  ]);
  const [aEspAA1,aEspEP1] = await Actividad.create([
    { nombre:'Tarea - Analisis de texto',     componente:'AA',   asignatura:aEsp7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:20, fecha:new Date(ANIO+'-02-10') },
    { nombre:'Examen I Parcial - Espanol',    componente:'E-EP', asignatura:aEsp7._id, parcial:p1._id, seccion:s7A._id, puntajeMax:50, fecha:new Date(ANIO+'-03-22') },
  ]);
  const alumnos10 = alumnos.filter(a=>a.grado==='10 Grado');
  const [aPrg1,aPrg2] = await Actividad.create([
    { nombre:'Laboratorio 1 - Variables',     componente:'AA',   asignatura:aPrg10._id, parcial:p1._id, seccion:s10btcA._id, puntajeMax:20, fecha:new Date(ANIO+'-02-12') },
    { nombre:'Proyecto - App Consola',        componente:'AEA',  asignatura:aPrg10._id, parcial:p1._id, seccion:s10btcA._id, puntajeMax:30, fecha:new Date(ANIO+'-03-15') },
  ]);
  console.log('Actividades creadas (9)');

  // 12. NOTAS
  const notasOps = [];
  const alumnos7A = alumnos.filter(a=>a.grado==='7 Grado'&&a.seccion==='A');

  alumnos7A.forEach(al => {
    [[aAA1,10],[aAEA1,15],[aVA1,10],[aEP1,40]].forEach(([act,max]) =>
      notasOps.push({actividad:act._id,alumno:al._id,nota:Math.round(max*rnd(0.55,1.0)*10)/10}));
    [[aAA2,10],[aAEA2,15],[aEP2,40]].forEach(([act,max]) =>
      notasOps.push({actividad:act._id,alumno:al._id,nota:Math.round(max*rnd(0.50,1.0)*10)/10}));
    [[aEspAA1,20],[aEspEP1,50]].forEach(([act,max]) =>
      notasOps.push({actividad:act._id,alumno:al._id,nota:Math.round(max*rnd(0.58,1.0)*10)/10}));
  });
  alumnos10.forEach(al => {
    [[aPrg1,20],[aPrg2,30]].forEach(([act,max]) =>
      notasOps.push({actividad:act._id,alumno:al._id,nota:Math.round(max*rnd(0.60,1.0)*10)/10}));
  });

  await Nota.insertMany(notasOps);
  console.log('Notas creadas ('+notasOps.length+')');

  // 13. ASISTENCIA
  const fechas = [ANIO+'-04-07',ANIO+'-04-08',ANIO+'-04-09',ANIO+'-04-14',ANIO+'-04-15',ANIO+'-04-22'];
  const estats = ['presente','presente','presente','presente','ausente','tarde','presente','presente','excusa','presente'];
  for (const f of fechas) {
    await Asistencia.create({
      asignatura:aMat7._id, seccion:s7A._id, docente:dMario._id,
      fecha:new Date(f+'T12:00:00'),
      tema:'Clase de Matematicas - '+f,
      detalle:alumnos7A.map((al,i)=>({alumno:al._id,estado:estats[i%estats.length],comentario:estats[i%estats.length]!=='presente'?'Sin justificacion':''})),
    }).catch(()=>{});
  }
  for (const f of fechas.slice(0,4)) {
    await Asistencia.create({
      asignatura:aPrg10._id, seccion:s10btcA._id, docente:dCarlos._id,
      fecha:new Date(f+'T14:00:00'),
      tema:'Programacion I - '+f,
      detalle:alumnos10.map((al,i)=>({alumno:al._id,estado:i===2?'ausente':'presente',comentario:''})),
    }).catch(()=>{});
  }
  console.log('Asistencia creada (10 sesiones)');

  // 14. USUARIO ESTUDIANTE DE PRUEBA
  const uEstudiante = await Usuario.create({
    nombre: 'Carlos Alberto Mendoza', email: 'estudiante@softwork.com',
    password: 'Est2025!', rol: 'estudiante',
  });
  // Vincular al primer alumno (Carlos Alberto Mendoza Lopez)
  await Alumno.findByIdAndUpdate(alumnos[0]._id, { usuario: uEstudiante._id });
  console.log('Usuario estudiante creado y vinculado');

  // RESUMEN
  console.log('\n================================================================');
  console.log('  BASE DE DATOS LISTA PARA PRUEBAS - SoftWork V17');
  console.log('================================================================');
  console.log('\n  CREDENCIALES:');
  console.log('  director@softwork.com     / Dir2025!   (Director - acceso total)');
  console.log('  subdirector@softwork.com  / Sub2025!   (Subdirector)');
  console.log('  admin@softwork.com        / Admin2025  (Administrativo)');
  console.log('  secretaria@softwork.com   / Sec2025!   (Secretario)');
  console.log('  consejero@softwork.com    / Con2025!   (Consejero)');
  console.log('  mario@softwork.com        / Doc2025!   (Docente - Matematicas)');
  console.log('  padre@softwork.com        / Padre2025! (Roberto Mendoza, padre de Carlos Mendoza)');
  console.log('  estudiante@softwork.com   / Est2025!   (Estudiante Carlos Mendoza)');
  console.log('\n  DATOS:');
  console.log('  30 alumnos con datos completos hondurenos');
  console.log('  7 grados  |  7 secciones  |  5 docentes  |  16 asignaturas');
  console.log('  30 matriculas (2 con encargado vinculado)  |  4 parciales  |  9 actividades');
  console.log('  Notas en I y II parcial para 7 Grado A y 10 Grado BTC');
  console.log('  10 sesiones de asistencia con estados variados');
  console.log('================================================================\n');
  process.exit(0);
};

main().catch(e=>{console.error('Error:',e.message);process.exit(1);});
