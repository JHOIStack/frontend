#!/usr/bin/env node

// Servidor HTTPS local para probar PWA sin necesidad de certificado real
// Usa certificados auto-firmados (el navegador mostrará advertencia, pero funcionará)

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;
const DIR = path.join(__dirname, 'dist', 'smarthabits', 'browser');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function createServer(useHttps = false) {
  const handler = (req, res) => {
    let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Si el archivo no existe y no tiene extensión, servir index.html (para rutas de Angular)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath);
      if (!ext || ext === '') {
        filePath = path.join(DIR, 'index.html');
      }
    }

    // Si aún no existe, servir index.html
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(DIR, 'index.html'), (err, content) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  };

  if (useHttps) {
    // Intentar usar certificados auto-firmados
    const certPath = path.join(__dirname, 'cert.pem');
    const keyPath = path.join(__dirname, 'key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      return https.createServer(options, handler);
    } else {
      console.log('⚠️  Certificados HTTPS no encontrados. Usando HTTP.');
      console.log('   Para HTTPS, ejecuta: npm run setup:https');
      return http.createServer(handler);
    }
  }
  
  return http.createServer(handler);
}

const server = createServer(false);

server.listen(PORT, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🚀 SmartHabits PWA servida en http://localhost:${PORT}`);
  console.log('');
  console.log('📱 Para probar en dispositivos móviles:');
  console.log(`   • iPhone/iPad (Safari): http://${localIP}:${PORT}`);
  console.log(`   • Android (Chrome): http://${localIP}:${PORT}`);
  console.log('');
  console.log('⚠️  NOTA: Para instalación completa de PWA, necesitas HTTPS.');
  console.log('   Opciones:');
  console.log('   1. Usar ngrok (túnel HTTPS gratuito): npm run serve:ngrok');
  console.log('   2. Configurar certificados locales: npm run setup:https');
  console.log('   3. Usar localhost en Android (funciona sin HTTPS)');
  console.log('');
  console.log('💡 Presiona Ctrl+C para detener el servidor');
  console.log('');
});


