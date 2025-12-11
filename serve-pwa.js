#!/usr/bin/env node

// Servidor simple para servir la PWA con soporte para rutas de Angular
const http = require('http');
const fs = require('fs');
const path = require('path');

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

const server = http.createServer((req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Si el archivo no existe y no tiene extensión, servir index.html (para rutas de Angular)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Verificar si es una ruta de API o archivo estático
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
        // Si no se encuentra, servir index.html para SPA
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
});

server.listen(PORT, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Encontrar la IP local automáticamente
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // Ignorar direcciones internas y no IPv4
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
  console.log('📖 Ver PWA_MOBILE_TESTING.md para instrucciones detalladas');
  console.log('');
  console.log('💡 Presiona Ctrl+C para detener el servidor');
  console.log('');
});

