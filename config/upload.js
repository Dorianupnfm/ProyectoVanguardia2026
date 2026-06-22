// config/upload.js — configuración de multer para adjuntos de mensajería
const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');

const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/mensajeria'));
  },
  filename: function(req, file, cb) {
    const hash = crypto.randomBytes(8).toString('hex');
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + hash + ext);
  },
});

const fileFilter = function(req, file, cb) {
  if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
});

module.exports = upload;
