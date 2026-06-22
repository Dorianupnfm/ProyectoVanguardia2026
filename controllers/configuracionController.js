// controllers/configuracionController.js
const Configuracion = require('../models/Configuracion');
const path = require('path');
const fs   = require('fs');

const CLAVES = [
  { clave: 'inst_nombre',    tipo: 'texto',  desc: 'Nombre de la institución',         default: 'Instituto Nacional' },
  { clave: 'inst_direccion', tipo: 'texto',  desc: 'Dirección completa',                default: '' },
  { clave: 'inst_telefono',  tipo: 'texto',  desc: 'Teléfono principal',                default: '' },
  { clave: 'inst_email',     tipo: 'email',  desc: 'Correo institucional',              default: '' },
  { clave: 'inst_codigo',    tipo: 'texto',  desc: 'Código SACE / Código institucional',default: '' },
  { clave: 'inst_modalidad', tipo: 'texto',  desc: 'Modalidad educativa',               default: 'Educación Secundaria' },
  { clave: 'anio_lectivo',   tipo: 'numero', desc: 'Año lectivo activo',                default: String(new Date().getFullYear()) },
  { clave: 'nota_minima',    tipo: 'numero', desc: 'Nota mínima de aprobación',         default: '60' },
  { clave: 'inst_logo',      tipo: 'imagen', desc: 'Logo institucional (URL o base64)', default: '' },
];

// Obtener config como objeto {clave: valor}
const obtenerTodo = async () => {
  const registros = await Configuracion.find();
  const cfg = {};
  CLAVES.forEach(k => { cfg[k.clave] = k.default; });
  registros.forEach(r => { cfg[r.clave] = r.valor; });
  return cfg;
};

const mostrar = async (req, res) => {
  try {
    const cfg = await obtenerTodo();
    res.render('configuracion/index', { titulo: 'Configuración Institucional', cfg, CLAVES });
  } catch (e) {
    req.flash('error', 'Error al cargar la configuración.');
    res.redirect('/dashboard');
  }
};

const guardar = async (req, res) => {
  try {
    const ops = CLAVES
      .filter(k => k.tipo !== 'imagen')
      .map(k => ({
        updateOne: {
          filter: { clave: k.clave },
          update: { $set: { clave: k.clave, valor: req.body[k.clave] || k.default, tipo: k.tipo, descripcion: k.desc } },
          upsert: true,
        }
      }));

    // Logo como archivo
    if (req.body.logo_base64 && req.body.logo_base64.startsWith('data:image')) {
      ops.push({
        updateOne: {
          filter: { clave: 'inst_logo' },
          update: { $set: { clave: 'inst_logo', valor: req.body.logo_base64, tipo: 'imagen', descripcion: 'Logo institucional' } },
          upsert: true,
        }
      });
    }

    await Configuracion.bulkWrite(ops);
    req.flash('exito', 'Configuración guardada correctamente.');
    res.redirect('/configuracion');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar la configuración.');
    res.redirect('/configuracion');
  }
};

module.exports = { mostrar, guardar, obtenerTodo };
