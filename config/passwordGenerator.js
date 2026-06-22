// config/passwordGenerator.js
// Genera contraseñas temporales legibles para enviar por correo
// (evita caracteres ambiguos como 0/O, 1/l/I).

const CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const generarPasswordTemporal = (longitud = 10) => {
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    resultado += CARACTERES.charAt(Math.floor(Math.random() * CARACTERES.length));
  }
  return resultado;
};

module.exports = { generarPasswordTemporal };
