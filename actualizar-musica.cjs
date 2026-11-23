'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const carpeta = path.join(__dirname, 'assets', 'musica');
const extensiones = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac', '.opus', '.webm']);

async function buscar(directorio, canciones) {
  for (const entrada of await fs.readdir(directorio, { withFileTypes: true })) {
    const archivo = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) await buscar(archivo, canciones);
    else if (entrada.isFile() && extensiones.has(path.extname(entrada.name).toLowerCase())) {
      canciones.push(path.relative(carpeta, archivo).split(path.sep).join('/'));
    }
  }
}

async function actualizar() {
  await fs.mkdir(carpeta, { recursive: true });
  const canciones = [];
  await buscar(carpeta, canciones);
  canciones.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  const destino = path.join(carpeta, 'lista.json');
  await fs.writeFile(destino, JSON.stringify(canciones, null, 2) + '\n', 'utf8');
  console.log(`Lista actualizada: ${canciones.length} canciones.`);
  console.log(destino);
  if (!canciones.length) console.log('Agrega tus audios a assets/musica y ejecuta este script otra vez.');
  console.log('En el juego: pulsa M y luego Actualizar lista.');
}

actualizar().catch(error => {
  console.error('No se pudo actualizar la lista:', error.message);
  process.exitCode = 1;
});
