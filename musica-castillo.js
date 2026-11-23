/* Música independiente para castillo.js. Cargar después del script del castillo. */
(() => {
'use strict';
if(window.musicaCastillo)return;
const base=new URL('./assets/musica/',document.baseURI),storage='castillo-musica-v1';
let opciones={volumen:.35,aleatorio:false},lista=[],indice=0,abierto=false,reanudar=false,focoAnterior=null,solicitado=false;
try{Object.assign(opciones,JSON.parse(localStorage.getItem(storage)||'{}'));}catch{}
const guardar=()=>{try{localStorage.setItem(storage,JSON.stringify(opciones));}catch{}};
const estilo=document.createElement('style');
estilo.textContent=`
#musica-castillo[hidden]{display:none!important}
#musica-castillo{position:fixed;inset:0;background:#050b14b8;z-index:100000;display:grid;place-items:center;padding:16px;color:#f7ecd3;font:15px system-ui;box-sizing:border-box}
#musica-castillo *{box-sizing:border-box}
#musica-castillo .mc-caja{width:min(520px,100%);max-height:88dvh;overflow:auto;padding:22px;background:linear-gradient(140deg,#243746,#101c29);border:1px solid #c2a46c;border-radius:18px;box-shadow:0 18px 70px #0009}
#musica-castillo header{display:flex;align-items:center;justify-content:space-between;gap:12px}
#musica-castillo h2{font:26px Georgia;margin:0;color:#f3d69a}
#musica-castillo button,#musica-castillo select{font:inherit;color:inherit;background:#304858;border:1px solid #a68d62;border-radius:8px;padding:10px;min-height:44px;cursor:pointer}
#musica-castillo button:hover{background:#496274}
#musica-castillo button:focus-visible,#musica-castillo select:focus-visible,#musica-castillo input:focus-visible{outline:3px solid #f3d69a;outline-offset:3px}
#musica-castillo button:disabled{opacity:.45;cursor:default}
#musica-castillo audio,#musica-castillo select{width:100%;margin:10px 0}
#musica-castillo .mc-fila{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
#musica-castillo .mc-nota{font-size:13px;color:#c4cdd5;line-height:1.5}
#musica-castillo .mc-nombre{overflow-wrap:anywhere;min-height:24px}
#musica-castillo input[type=range]{width:100%}
#mc-abrir{position:fixed;right:14px;bottom:16px;z-index:1000;background:#172d3ce8;color:#f3d69a;border:1px solid #b99a61;border-radius:10px;padding:10px 14px;font:14px system-ui;cursor:pointer;min-height:44px}
`;
document.head.appendChild(estilo);
const panel=document.createElement('section');panel.id='musica-castillo';panel.hidden=true;
panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mc-titulo');
panel.innerHTML=`<div class="mc-caja"><header><h2 id="mc-titulo">Música del castillo</h2><button type="button" data-cerrar aria-label="Cerrar reproductor">Cerrar · M</button></header>
<p class="mc-nombre" aria-live="polite">Cargando canciones…</p>
<label for="mc-lista">Canciones</label><select id="mc-lista" aria-label="Seleccionar canción"></select>
<audio controls preload="metadata" controlslist="nodownload" aria-label="Reproductor de música"></audio>
<div class="mc-fila"><button type="button" data-anterior>Anterior</button><button type="button" data-siguiente>Siguiente</button><button type="button" data-aleatorio aria-pressed="false">Aleatorio</button><button type="button" data-actualizar>Actualizar lista</button></div>
<label for="mc-volumen">Volumen de fondo: <output id="mc-porcentaje"></output></label><input id="mc-volumen" type="range" min="0" max="100" step="1">
<p class="mc-nota">M: abrir/cerrar · Esc: cerrar. La música continúa al cerrar el reproductor. La lista se repite al terminar. Si reproduces un vídeo, la música baja de volumen.</p><p data-estado class="mc-nota" role="status"></p></div>`;
document.body.appendChild(panel);
const acceso=document.createElement('button');acceso.id='mc-abrir';acceso.type='button';acceso.textContent='M · Música';acceso.setAttribute('aria-controls',panel.id);acceso.setAttribute('aria-expanded','false');document.body.appendChild(acceso);
const audio=panel.querySelector('audio'),selector=panel.querySelector('select'),nombre=panel.querySelector('.mc-nombre'),estado=panel.querySelector('[data-estado]'),volumen=panel.querySelector('input'),porcentaje=panel.querySelector('output');
const anterior=panel.querySelector('[data-anterior]'),siguiente=panel.querySelector('[data-siguiente]'),aleatorio=panel.querySelector('[data-aleatorio]'),cerrarBtn=panel.querySelector('[data-cerrar]');
const videos=new Set();document.querySelectorAll('video').forEach(v=>{if(!v.paused&&!v.ended)videos.add(v);});
function ajustarVolumen(){
 opciones.volumen=Math.max(0,Math.min(1,Number(opciones.volumen)||0));
 audio.volume=opciones.volumen*(videos.size?.18:1);volumen.value=Math.round(opciones.volumen*100);porcentaje.value=volumen.value+' %';
}
function cambiarVideo(e){if(e.target.tagName!=='VIDEO')return;if(e.type==='play')videos.add(e.target);else videos.delete(e.target);ajustarVolumen();}
for(const tipo of ['play','pause','ended','emptied'])document.addEventListener(tipo,cambiarVideo,true);
function interfaz(){selector.disabled=!lista.length;anterior.disabled=siguiente.disabled=!lista.length;aleatorio.setAttribute('aria-pressed',String(!!opciones.aleatorio));nombre.textContent=lista[indice]?.titulo||'No hay canciones en la lista';selector.value=String(indice);}
async function reproducir(){
 if(!lista.length)return;
 solicitado=true;
 try{await audio.play();estado.textContent='';}catch(e){estado.textContent=e.name==='NotAllowedError'?'Pulsa Reproducir para autorizar el audio.':'No se pudo reproducir. Revisa el nombre, la ruta y el formato de la canción.';}
}
function elegir(n,iniciar=true){if(!lista.length)return;indice=(n+lista.length)%lista.length;audio.src=lista[indice].src;interfaz();if(iniciar)reproducir();}
function avanzar(d=1){let n=indice+d;if(opciones.aleatorio&&lista.length>1)n=(indice+1+Math.floor(Math.random()*(lista.length-1)))%lista.length;elegir(n);}
let cargando=false;
async function cargar(){
 if(cargando)return;cargando=true;estado.textContent='Leyendo assets/musica/lista.json…';
 try{
  const r=await fetch(new URL('lista.json',base),{cache:'no-store'});if(!r.ok)throw Error('No se encontró lista.json. Ejecuta ACTUALIZAR_MUSICA.bat desde la raíz del proyecto.');
  const datos=JSON.parse((await r.text()).replace(/^\uFEFF/,''));
  if(!Array.isArray(datos))throw Error('lista.json debe contener una lista de nombres de archivos.');
  const nueva=datos.filter(x=>typeof x==='string'&&/\.(mp3|ogg|wav|m4a|aac|flac|opus|webm)$/i.test(x)).map(archivo=>{
   const partes=archivo.replace(/\\/g,'/').split('/');if(partes.some(p=>p==='..'||p==='.'||!p))return null;
   return {archivo,titulo:partes.at(-1).replace(/\.[^.]+$/,''),src:new URL(partes.map(encodeURIComponent).join('/'),base).href};
  }).filter(Boolean);
  const actual=lista[indice]?.archivo,seguia=!audio.paused;lista=nueva;
  selector.replaceChildren(...lista.map((p,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=p.titulo;return o;}));
  const conservado=lista.findIndex(p=>p.archivo===actual);
  if(conservado>=0){indice=conservado;interfaz();}
  else if(lista.length)elegir(0,seguia||solicitado);
  else{audio.pause();audio.removeAttribute('src');audio.load();indice=0;interfaz();}
  estado.textContent=lista.length?`${lista.length} canciones disponibles.`:'La carpeta no tiene archivos de audio compatibles.';
 }catch(e){estado.textContent=e.message;if(!lista.length)interfaz();}finally{cargando=false;}
}
function otroDialogo(){return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(el=>el!==panel&&!el.hidden&&el.getClientRects().length);}
function abrir(){
 if(abierto||otroDialogo())return;
 focoAnterior=document.activeElement;const menu=document.getElementById('menu');reanudar=!!document.pointerLockElement||!!(menu&&menu.hidden);
 abierto=true;panel.hidden=false;acceso.setAttribute('aria-expanded','true');
 if(reanudar)window.controlesCastillo?.pausar?.();
 if(document.pointerLockElement){try{document.exitPointerLock();}catch{}}
 if(menu)menu.hidden=true;cerrarBtn.focus();
}
function cerrar(){
 if(!abierto)return;abierto=false;panel.hidden=true;acceso.setAttribute('aria-expanded','false');
 const menu=document.getElementById('menu');
 if(reanudar){if(menu)menu.hidden=false;document.getElementById('boton-iniciar')?.click();}
 else{if(menu)menu.hidden=false;focoAnterior?.focus?.();}
 reanudar=false;
}
document.addEventListener('pointerlockchange',()=>{if(abierto){const menu=document.getElementById('menu');if(menu)menu.hidden=true;}});
function teclado(e){
 const editable=e.target instanceof Element&&(e.target.matches('input:not([type=range]),textarea,select')||e.target.isContentEditable);
 if(e.type==='keydown'&&e.code==='KeyM'&&!editable&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)(abierto?cerrar:abrir)();return;}
 if(!abierto)return;
 if(e.type==='keydown'&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
 if(e.type==='keydown'&&e.code==='Tab'){
  const items=[...panel.querySelectorAll('button,select,input,audio')].filter(el=>!el.disabled&&el.getClientRects().length),primero=items[0],ultimo=items.at(-1);
  if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}
  else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
 }
 e.stopImmediatePropagation();
}
window.addEventListener('keydown',teclado,true);window.addEventListener('keyup',teclado,true);
acceso.addEventListener('click',abrir);cerrarBtn.addEventListener('click',cerrar);
anterior.addEventListener('click',()=>avanzar(-1));siguiente.addEventListener('click',()=>avanzar(1));
selector.addEventListener('change',()=>elegir(Number(selector.value)));
aleatorio.addEventListener('click',()=>{opciones.aleatorio=!opciones.aleatorio;guardar();interfaz();});
volumen.addEventListener('input',()=>{opciones.volumen=Number(volumen.value)/100;ajustarVolumen();guardar();});
panel.querySelector('[data-actualizar]').addEventListener('click',cargar);
audio.addEventListener('ended',()=>avanzar(1));audio.addEventListener('play',()=>{solicitado=true;});
audio.addEventListener('error',()=>{estado.textContent='No se pudo cargar esta canción. Comprueba que exista en assets/musica y vuelve a generar la lista.';});
// El clic de entrada autoriza el intento de reproducción; no se fuerza al cargar la página.
document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('#boton-iniciar')&&!solicitado&&lista.length)reproducir();},true);
ajustarVolumen();interfaz();cargar();
window.musicaCastillo={abrir,cerrar,actualizarLista:cargar,reproducir,pausar:()=>audio.pause(),get audio(){return audio;}};
})();
