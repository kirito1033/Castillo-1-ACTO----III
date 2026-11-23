import * as __THREE from 'three';
import { PointerLockControls as __PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const __modules = {
"./controlesTactiles.js": function(module, exports, __require) {

function crearControlesTactiles(accion) {
  const estado={x:0,y:0,mirarX:0,mirarY:0,correr:false,subir:false,bajar:false};
  const estilo=document.createElement('style');
  estilo.textContent=`
    #controles-tactiles{position:fixed;inset:0;z-index:8;pointer-events:none;user-select:none;-webkit-user-select:none}
    #controles-tactiles[hidden]{display:none!important}
    #controles-tactiles *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    #ct-mirada{position:absolute;right:0;top:0;width:58%;height:100%;pointer-events:auto;touch-action:none}
    #ct-mirada span{position:absolute;top:35%;left:20%;color:#fff8;font:12px Arial;text-shadow:0 1px 3px #000;pointer-events:none}
    #ct-joystick{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:calc(24px + env(safe-area-inset-bottom));width:clamp(105px,27vw,145px);aspect-ratio:1;border:2px solid #ffffff70;border-radius:50%;background:#13232b75;pointer-events:auto;touch-action:none}
    #ct-palanca{position:absolute;left:50%;top:50%;width:44%;height:44%;border-radius:50%;border:1px solid #ffffffa0;background:#d1b783a8;transform:translate(-50%,-50%);pointer-events:none}
    #ct-acciones{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:calc(20px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(2,clamp(62px,17vw,82px));gap:9px;pointer-events:none}
    .ct-boton{min-height:48px;border:1px solid #ffffff80;border-radius:12px;background:#172932c9;color:white;font:600 13px Arial;pointer-events:auto;touch-action:none;padding:8px;box-shadow:0 2px 8px #0005}
    .ct-boton:active,.ct-boton.ct-activo{background:#8a713ddd;border-color:#ffe2a0}
    #ct-menu{position:absolute;left:max(16px,env(safe-area-inset-left));top:calc(65px + env(safe-area-inset-top));min-width:72px;min-height:44px}
    .ct-vuelo[hidden]{display:none!important}
    body.ct-jugando #ayuda{display:none}
    @media(max-height:450px){#ct-acciones{gap:6px;grid-template-columns:repeat(3,65px)}.ct-boton{min-height:42px;font-size:12px}#ct-joystick{width:112px;bottom:16px}#ct-menu{top:12px;left:calc(50% - 36px)}}
  `;
  document.head.appendChild(estilo);
  const meta=document.querySelector('meta[name="viewport"]');
  if(meta&&!meta.content.includes('viewport-fit'))meta.content+=', viewport-fit=cover';
  const raiz=document.createElement('div');raiz.id='controles-tactiles';raiz.hidden=true;
  raiz.innerHTML='<div id="ct-mirada"><span>Desliza para mirar</span></div><div id="ct-joystick" aria-label="Joystick para caminar"><div id="ct-palanca"></div></div><div id="ct-acciones"></div>';
  document.body.appendChild(raiz);
  const zona=raiz.querySelector('#ct-mirada'),joystick=raiz.querySelector('#ct-joystick'),palanca=raiz.querySelector('#ct-palanca'),acciones=raiz.querySelector('#ct-acciones');
  let activo=false,idJoy=null,idMirada=null,ultimoX=0,ultimoY=0,ultimoVuelo=null;
  const retenidos=new Map();
  function capturar(el,e){try{el.setPointerCapture(e.pointerId);}catch{}}
  function impedir(e){e.preventDefault();e.stopPropagation();}
  function palancaMover(e){
    const r=joystick.getBoundingClientRect(),radio=r.width*0.34;
    let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const n=Math.hypot(dx,dy);if(n>radio){dx*=radio/n;dy*=radio/n;}
    let x=dx/radio,y=-dy/radio;
    const longitud=Math.hypot(x,y),muerta=0.10;
    if(longitud<muerta){x=0;y=0;}else{const factor=(longitud-muerta)/(1-muerta)/longitud;x*=factor;y*=factor;}
    estado.x=x;estado.y=y;palanca.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  }
  joystick.addEventListener('pointerdown',e=>{if(!activo||idJoy!==null)return;impedir(e);idJoy=e.pointerId;capturar(joystick,e);palancaMover(e);});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId!==idJoy)return;impedir(e);palancaMover(e);});
  function soltarJoy(e){if(e.pointerId!==idJoy)return;idJoy=null;estado.x=estado.y=0;palanca.style.transform='translate(-50%,-50%)';}
  for(const tipo of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(tipo,soltarJoy);
  zona.addEventListener('pointerdown',e=>{if(!activo||idMirada!==null)return;impedir(e);idMirada=e.pointerId;ultimoX=e.clientX;ultimoY=e.clientY;capturar(zona,e);});
  zona.addEventListener('pointermove',e=>{if(!activo||e.pointerId!==idMirada)return;impedir(e);estado.mirarX+=e.clientX-ultimoX;estado.mirarY+=e.clientY-ultimoY;ultimoX=e.clientX;ultimoY=e.clientY;});
  function soltarMirada(e){if(e.pointerId===idMirada)idMirada=null;}
  for(const tipo of ['pointerup','pointercancel','lostpointercapture'])zona.addEventListener(tipo,soltarMirada);
  function boton(texto,id,sostenido=false) {
    const b=document.createElement('button');b.type='button';b.className='ct-boton';b.textContent=texto;b.setAttribute('aria-label',texto);acciones.appendChild(b);
    const ids=new Set();retenidos.set(b,{ids,id});
    b.addEventListener('pointerdown',e=>{
      if(!activo)return;impedir(e);capturar(b,e);
      if(sostenido){ids.add(e.pointerId);estado[id]=true;b.classList.add('ct-activo');}
      else accion(id);
    });
    function fin(e){if(!ids.has(e.pointerId))return;ids.delete(e.pointerId);estado[id]=ids.size>0;if(!ids.size)b.classList.remove('ct-activo');}
    for(const tipo of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(tipo,fin);
    b.addEventListener('click',e=>{e.preventDefault();if(activo&&e.detail===0&&!sostenido)accion(id);});
    return b;
  }
  const puerta=boton('Puerta','puerta');
  const vuelo=boton('Volar','vuelo');
  boton('Correr','correr',true);
  const subir=boton('Subir ↑','subir',true),bajar=boton('Bajar ↓','bajar',true);
  subir.classList.add('ct-vuelo');bajar.classList.add('ct-vuelo');
  const menu=boton('Menú','menu');menu.id='ct-menu';raiz.appendChild(menu);
  function reiniciar(){
    estado.x=estado.y=estado.mirarX=estado.mirarY=0;estado.correr=estado.subir=estado.bajar=false;idJoy=idMirada=null;
    palanca.style.transform='translate(-50%,-50%)';
    for(const [b,r] of retenidos){r.ids.clear();b.classList.remove('ct-activo');}
  }
  function setActivo(valor){activo=Boolean(valor);raiz.hidden=!activo;document.body.classList.toggle('ct-jugando',activo);if(!activo)reiniciar();}
  function setVuelo(valor){
    if(valor===ultimoVuelo)return;ultimoVuelo=valor;vuelo.textContent=valor?'Aterrizar':'Volar';vuelo.classList.toggle('ct-activo',valor);subir.hidden=bajar.hidden=!valor;
    if(!valor){estado.subir=estado.bajar=false;for(const b of [subir,bajar]){retenidos.get(b).ids.clear();b.classList.remove('ct-activo');}}
  }
  function setPuerta(p){puerta.style.opacity=p?'1':'0.65';puerta.setAttribute('aria-label',p?`${p.abierta?'Cerrar':'Abrir'} ${p.nombre}`:'Puerta cercana');}
  raiz.addEventListener('contextmenu',e=>e.preventDefault());setVuelo(false);
  return {estado,setActivo,setVuelo,setPuerta,reiniciar};
}

exports.crearControlesTactiles = crearControlesTactiles;
},
"./salaBibliotecaVideo.js": function(module, exports, __require) {
const THREE = __THREE;


// =============================================================
// BIBLIOTECA: SALA DE VIDEO, FOCOS Y PARPADEO POR CANCION
// Compatible con el main.js existente. No requiere otros modulos.
// =============================================================
function crearSalaBibliotecaVideo(escena, camara, castillo, opciones = {}) {

  // -----------------------------------------------------------
  // 01. REFERENCIAS, CONFIGURACION Y ESTADO
  // -----------------------------------------------------------
  const puerta = castillo.userData.puertas.find(p => p.nombre === 'Biblioteca');
  if (!puerta) throw new Error('No se encontró la puerta Biblioteca.');

  const recursos = { texturas: [], materiales: [], geometrias: [] };
  const inv = new THREE.Matrix4(), posicion = new THREE.Vector3();
  castillo.updateMatrixWorld(true); inv.copy(castillo.matrixWorld).invert();
  const protegidos = new Set(); puerta.marco.traverse(o => protegidos.add(o));
  const playlist = (opciones.videos || []).map((v, i) => typeof v === 'string'
    ? { src: v, titulo: 'Vídeo ' + (i + 1), tiempo: 0 } : { ...v, tiempo: 0 });

  let indice = 0, video = null, texturaVideo = null, habilitado = false;
  let controles = null, oclusion = null, panelAbierto = false;
  let estabaDentro = false, relojUI = 0, destruido = false;
  const colorRespaldo = opciones.colorFocos ?? 0xffd39a;
  const separacionFocos = Math.max(0.45, Number.isFinite(opciones.separacionFocos)
    ? opciones.separacionFocos : 0.7);
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const parpadeo = {
    activo: false, tiempo: 0, brillo: 1, pulsos: 2, ultimoInicio: -Infinity,
    duracion: THREE.MathUtils.clamp(Number.isFinite(opciones.duracionParpadeo)
      ? opciones.duracionParpadeo : 1.4, 1.2, 4),
    brilloMinimo: 0.35
  };
  const colorBaseFocos = new THREE.Color(colorRespaldo);

  function esNegroBasico(m) {
    return m?.isMeshBasicMaterial && m.color?.getHex() === 0 && !m.map;
  }
  if (!Array.isArray(puerta.hoja.material) && esNegroBasico(puerta.hoja.material)) {
    const otra = castillo.userData.puertas.find(p => p !== puerta &&
      !(Array.isArray(p.hoja.material) ? p.hoja.material.some(esNegroBasico)
        : esNegroBasico(p.hoja.material)));
    if (otra) puerta.hoja.material = otra.hoja.material;
  }
  const materialPuerta = puerta.hoja.material;
  const enBiblioteca = v => v.x > -19.85 && v.x < -7.15 &&
    v.z > -1.85 && v.z < 17.85 && v.y > 3.05 && v.y < 9.85;

  // -----------------------------------------------------------
  // 02. RETIRAR LA BARANDA INVASORA, MUEBLES Y LUCES ANTIGUAS
  // -----------------------------------------------------------
  const cierre = castillo.getObjectByName('Cierre frontal izquierdo');
  if (cierre) {
    const minX = cierre.position.x - cierre.scale.x / 2;
    const maxX = cierre.position.x + cierre.scale.x / 2;
    if (maxX > -20) {
      const ancho = Math.max(0, -20 - minX);
      if (ancho > 0.01) {
        cierre.scale.x = ancho; cierre.position.x = minX + ancho / 2;
        for (const c of castillo.userData.colisiones) if (c.mesh === cierre) c.w = ancho;
        cierre.updateMatrix(); cierre.updateWorldMatrix(true, false);
      } else {
        const lista = castillo.userData.colisiones;
        for (let i = lista.length - 1; i >= 0; i--) if (lista[i].mesh === cierre) lista.splice(i, 1);
        cierre.removeFromParent();
      }
    }
  }
  const muebles = /^(Mesa|Armario|Estanteria|Libros|Cama|Cabecera|Cadena candelabro|Brazo candelabro|Vela|Soporte antorcha)/i;
  const eliminar = new Set();
  castillo.traverse(o => {
    if (protegidos.has(o)) return;
    o.getWorldPosition(posicion).applyMatrix4(inv);
    if (!enBiblioteca(posicion)) return;
    if (o.isPointLight || (o.isMesh && muebles.test(o.name))) { eliminar.add(o); return; }
    if (o.isMesh && o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (ms.some(m => m?.emissive && (m.emissive.r > 0.05 || m.emissive.g > 0.05 || m.emissive.b > 0.05))) eliminar.add(o);
    }
    if (o.isGroup && o.children.some(c => c.isMesh && c.material?.emissive?.g > 0.1)) eliminar.add(o);
  });
  const todos = new Set(); for (const o of eliminar) o.traverse(c => todos.add(c));
  let colisionesRetiradas = 0;
  const colisiones = castillo.userData.colisiones;
  for (let i = colisiones.length - 1; i >= 0; i--) if (todos.has(colisiones[i].mesh)) {
    colisiones.splice(i, 1); colisionesRetiradas++;
  }
  for (const o of eliminar) o.removeFromParent();

  // -----------------------------------------------------------
  // 03. TEXTURAS PROCEDURALES Y MATERIALES
  // -----------------------------------------------------------
  let semilla = 412;
  const azar = () => { semilla = (Math.imul(1664525, semilla) + 1013904223) >>> 0; return semilla / 4294967296; };
  function crearTextura(tipo) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    if (tipo === 'madera') {
      ctx.fillStyle = '#21160e'; ctx.fillRect(0, 0, 256, 256);
      for (let tabla = 0; tabla < 4; tabla++) {
        const v = Math.floor(azar() * 10);
        ctx.fillStyle = `rgb(${35 + v},${24 + v},${16 + v})`;
        ctx.fillRect(tabla * 64 + 1, 0, 62, 256);
        for (let j = 0; j < 28; j++) {
          const x = tabla * 64 + 3 + azar() * 58;
          ctx.strokeStyle = `rgba(15,10,6,${0.15 + azar() * 0.25})`;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 6, 85, x - 6, 170, x, 256); ctx.stroke();
        }
        ctx.fillStyle = '#140c08'; ctx.fillRect(tabla * 64, 0, 1, 256);
      }
    } else {
      ctx.fillStyle = tipo === 'pared' ? '#323438' : '#181b1f'; ctx.fillRect(0, 0, 256, 256);
      const imagen = ctx.getImageData(0, 0, 256, 256);
      for (let i = 0; i < imagen.data.length; i += 4) {
        const ruido = (azar() - 0.5) * (tipo === 'pared' ? 16 : 8);
        for (let j = 0; j < 3; j++) imagen.data[i + j] += ruido;
      }
      ctx.putImageData(imagen, 0, 0);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; recursos.texturas.push(t); return t;
  }
  function material(color, map = null) {
    const m = new THREE.MeshBasicMaterial({ color, map, toneMapped: false });
    recursos.materiales.push(m); return m;
  }
  const matPared = material(0xffffff, crearTextura('pared'));
  const matSuelo = material(0xffffff, crearTextura('madera'));
  const matTecho = material(0xffffff, crearTextura('techo'));
  const matMoldura = material(0x4a4338), matMarco = material(0x1a1c1e), matFriso = material(0x281d15);
  const matLed = material(colorRespaldo), matPortafoco = material(0x756348), matBombillo = material(colorRespaldo);

  // -----------------------------------------------------------
  // 04. PAREDES, SUELO Y TECHO
  // -----------------------------------------------------------
  const cajaGeo = new THREE.BoxGeometry(1, 1, 1); recursos.geometrias.push(cajaGeo);
  const revestimiento = new THREE.Group(); revestimiento.name = 'Biblioteca castillo oscuro'; castillo.add(revestimiento);
  function panel(nombre, x, y, z, w, h, d, mat = matPared) {
    const g = cajaGeo.clone(), uv = g.attributes.uv;
    const caras = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]], tile = mat === matSuelo ? [2.4,3] : [3,3];
    for (let i = 0; i < uv.count; i++) {
      const [u,v] = caras[Math.floor(i / 4)]; uv.setXY(i, uv.getX(i) * u / tile[0], uv.getY(i) * v / tile[1]);
    }
    g.clearGroups(); recursos.geometrias.push(g);
    const o = new THREE.Mesh(g, mat); o.name = nombre; o.position.set(x,y,z); o.scale.set(w,h,d);
    o.userData.habitacion = 'Biblioteca'; revestimiento.add(o); return o;
  }
  panel('Suelo nogal oscuro biblioteca',-13.45,3.025,8,12.2,0.02,19.2,matSuelo);
  panel('Techo oscuro biblioteca',-13.45,9.675,8,12.2,0.02,19.2,matTecho);
  panel('Fondo piedra biblioteca',-19.55,6.35,8,0.025,6.6,19.2);
  panel('Lateral piedra biblioteca',-13.45,6.35,-1.6,12.2,6.6,0.025);
  panel('Lateral piedra biblioteca',-13.45,6.35,17.6,12.2,6.6,0.025);
  panel('Entrada biblioteca izquierda',-7.35,6.35,2.55,0.025,6.6,8.3);
  panel('Entrada biblioteca derecha',-7.35,6.35,13.45,0.025,6.6,8.3);
  panel('Dintel biblioteca',-7.35,8.15,8,0.025,3,2.6);

  // -----------------------------------------------------------
  // 05. REVESTIMIENTO PARCIAL DE COLUMNAS, SIN CORTAR TORRES
  // -----------------------------------------------------------
  function revestirColumnas() {
    const caja = new THREE.Box3(new THREE.Vector3(-19.53,3.06,-1.58),new THREE.Vector3(-7.38,9.64,17.58));
    castillo.updateMatrixWorld(true);
    const inversa = new THREE.Matrix4().copy(castillo.matrixWorld).invert();
    const candidatos = [], box = new THREE.Box3();
    castillo.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.geometry?.type !== 'CylinderGeometry') return;
      box.setFromObject(o).applyMatrix4(inversa); if (box.intersectsBox(caja)) candidatos.push(o);
    });
    const limites = [v=>v.x-caja.min.x,v=>caja.max.x-v.x,v=>v.y-caja.min.y,v=>caja.max.y-v.y,v=>v.z-caja.min.z,v=>caja.max.z-v.z];
    function recortar(poly, distancia) {
      const salida = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i+1)%poly.length], da = distancia(a), db = distancia(b);
        const ia = da >= -0.000001, ib = db >= -0.000001;
        if (ia) salida.push(a);
        if (ia !== ib) salida.push(a.clone().lerp(b,THREE.MathUtils.clamp(da/(da-db),0,1)));
      }
      return salida;
    }
    const vertices = [], uvs = []; let cantidadColumnas = 0;
    const agregar = v => { vertices.push(v.x,v.y,v.z); uvs.push(v.x/3,v.y/3); };
    for (const o of candidatos) {
      const pos = o.geometry.attributes.position, idx = o.geometry.index;
      const matriz = new THREE.Matrix4().multiplyMatrices(inversa,o.matrixWorld);
      const cantidad = idx ? idx.count : pos.count, antes = vertices.length;
      for (let i = 0; i < cantidad; i += 3) {
        let poly = [];
        for (let j = 0; j < 3; j++) poly.push(new THREE.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(matriz));
        for (const limite of limites) { poly = recortar(poly,limite); if (poly.length<3) break; }
        for (let j = 1; j < poly.length-1; j++) { agregar(poly[0]); agregar(poly[j]); agregar(poly[j+1]); }
      }
      if (vertices.length > antes) cantidadColumnas++;
    }
    if (vertices.length) {
      const g = new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();g.computeBoundingSphere();
      const m = matPared.clone();m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;
      const o = new THREE.Mesh(g,m);o.name='Revestimiento interior columnas biblioteca';o.userData.habitacion='Biblioteca';o.renderOrder=1;revestimiento.add(o);
      recursos.geometrias.push(g);recursos.materiales.push(m);
    }
    return cantidadColumnas;
  }
  const columnasRevestidas = revestirColumnas();

  // -----------------------------------------------------------
  // 06. DECORACION Y MARCOS AGRUPADOS
  // -----------------------------------------------------------
  const unidad = cajaGeo.toNonIndexed();
  function cajasAgrupadas(padre,nombre,items,mat) {
    const vertices=[],v=new THREE.Vector3(),matriz=new THREE.Matrix4(),q=new THREE.Quaternion(),eje=new THREE.Vector3(0,1,0);
    for (const [x,y,z,w,h,d,rot=0] of items) {
      q.setFromAxisAngle(eje,rot);matriz.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(w,h,d));
      for(let i=0;i<unidad.attributes.position.count;i++){v.fromBufferAttribute(unidad.attributes.position,i).applyMatrix4(matriz);vertices.push(v.x,v.y,v.z);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();g.computeBoundingSphere();recursos.geometrias.push(g);
    const o=new THREE.Mesh(g,mat);o.name=nombre;o.userData.habitacion='Biblioteca';padre.add(o);return o;
  }
  cajasAgrupadas(revestimiento,'Frisos nogal oscuro biblioteca',[
    [-19.51,3.62,8,0.02,1.12,19.16],[-13.45,3.62,17.56,12.14,1.12,0.02],[-13.45,3.62,-1.56,12.14,1.12,0.02],
    [-7.39,3.62,2.55,0.02,1.12,8.25],[-7.39,3.62,13.45,0.02,1.12,8.25]
  ],matFriso);
  const molduras=[];
  for(const y of [3.13,4.2,9.52])molduras.push([-19.48,y,8,0.035,0.045,19.1],[-13.45,y,17.53,12.1,0.045,0.035],[-13.45,y,-1.53,12.1,0.045,0.035]);
  cajasAgrupadas(revestimiento,'Molduras hierro biblioteca',molduras,matMoldura);
  cajasAgrupadas(revestimiento,'Vigas biblioteca',[1.5,8,14.5].map(z=>[-13.45,9.56,z,12.12,0.1,0.13]),matMarco);

  // -----------------------------------------------------------
  // 07. TRES PANTALLAS SINCRONIZADAS Y LED
  // -----------------------------------------------------------
  const pantallas=new THREE.Group();pantallas.name='Pantallas biblioteca';pantallas.visible=false;castillo.add(pantallas);
  const screenGeo=new THREE.PlaneGeometry(1,1);recursos.geometrias.push(screenGeo);
  const screenMat=material(0),monitores=[],piezasMarcos=[],piezasLeds=[],posicionesFocos=[];
  function pantalla(nombre,x,z,rot,w,h) {
    const o=new THREE.Mesh(screenGeo,screenMat);o.name=nombre;o.position.set(x,6.6,z);o.rotation.y=rot;o.scale.set(w,h,1);o.userData.habitacion='Biblioteca';pantallas.add(o);monitores.push({o,w,h});
    const punto=(dx,dy,dz)=>new THREE.Vector3(x+Math.cos(rot)*dx+Math.sin(rot)*dz,6.6+dy,z-Math.sin(rot)*dx+Math.cos(rot)*dz);
    function pieza(lista,dx,dy,dz,ancho,alto,fondo){const p=punto(dx,dy,dz);lista.push([p.x,p.y,p.z,ancho,alto,fondo,rot]);}
    pieza(piezasMarcos,0,0,-0.07,w+0.54,h+0.54,0.04);
    pieza(piezasMarcos,-w/2-0.14,0,-0.02,0.25,h+0.54,0.12);pieza(piezasMarcos,w/2+0.14,0,-0.02,0.25,h+0.54,0.12);
    pieza(piezasMarcos,0,h/2+0.14,-0.02,w+0.54,0.25,0.12);pieza(piezasMarcos,0,-h/2-0.14,-0.02,w+0.54,0.25,0.12);
    pieza(piezasLeds,-w/2-0.006,0,0.055,0.018,h-0.1,0.012);pieza(piezasLeds,w/2+0.006,0,0.055,0.018,h-0.1,0.012);
    pieza(piezasLeds,0,h/2+0.006,0.055,w-0.1,0.018,0.012);pieza(piezasLeds,0,-h/2-0.006,0.055,w-0.1,0.018,0.012);
    const foco=(dx,dy)=>posicionesFocos.push({base:punto(dx,dy,0.075),bombillo:punto(dx,dy,0.17),rot});
    const nh=Math.max(2,Math.ceil(w/separacionFocos)),nv=Math.max(2,Math.ceil(h/separacionFocos));
    for(let i=0;i<=nh;i++){const dx=THREE.MathUtils.lerp(-w/2,w/2,i/nh);foco(dx,h/2+0.14);foco(dx,-h/2-0.14);}
    for(let i=0;i<=nv;i++){const dy=THREE.MathUtils.lerp(-h/2,h/2,i/nv);foco(-w/2-0.14,dy);foco(w/2+0.14,dy);}
  }
  pantalla('Pantalla frontal biblioteca',-19.38,8,Math.PI/2,10,5.6);
  pantalla('Pantalla izquierda biblioteca',-13.4,17.43,Math.PI,9,5.1);
  pantalla('Pantalla derecha biblioteca',-13.4,-1.43,0,9,5.1);
  const marcos=cajasAgrupadas(pantallas,'Marcos pantallas biblioteca',piezasMarcos,matMarco);
  const leds=cajasAgrupadas(pantallas,'LED pantallas biblioteca',piezasLeds,matLed);unidad.dispose();

  // -----------------------------------------------------------
  // 08. FOCOS INSTANCIADOS Y HALOS: SIN POINTLIGHT POR BOMBILLO
  // -----------------------------------------------------------
  const geoPortafoco=new THREE.CylinderGeometry(0.115,0.13,0.055,8);geoPortafoco.rotateX(Math.PI/2);
  const geoBombillo=new THREE.SphereGeometry(0.085,8,6);recursos.geometrias.push(geoPortafoco,geoBombillo);
  const portafocos=new THREE.InstancedMesh(geoPortafoco,matPortafoco,posicionesFocos.length);
  const focos=new THREE.InstancedMesh(geoBombillo,matBombillo,posicionesFocos.length);
  portafocos.name='Portafocos biblioteca';focos.name='Bombillos biblioteca';
  portafocos.userData.habitacion=focos.userData.habitacion='Biblioteca';
  const auxiliar=new THREE.Object3D(),posicionesHalo=[];
  posicionesFocos.forEach((item,i)=>{
    auxiliar.position.copy(item.base);auxiliar.rotation.set(0,item.rot,0);auxiliar.updateMatrix();portafocos.setMatrixAt(i,auxiliar.matrix);
    auxiliar.position.copy(item.bombillo);auxiliar.rotation.set(0,0,0);auxiliar.updateMatrix();focos.setMatrixAt(i,auxiliar.matrix);
    posicionesHalo.push(item.bombillo.x,item.bombillo.y,item.bombillo.z);
  });
  for(const o of [portafocos,focos]){o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();o.castShadow=false;}
  pantallas.add(portafocos,focos);
  let halosFocos=null;
  if(opciones.halosFocos!==false){
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
    const grad=ctx.createRadialGradient(32,32,0,32,32,30);
    grad.addColorStop(0,'rgba(255,255,240,0.9)');grad.addColorStop(0.2,'rgba(255,225,170,0.5)');grad.addColorStop(1,'rgba(255,190,100,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=THREE.LinearFilter;recursos.texturas.push(t);
    const m=new THREE.PointsMaterial({map:t,color:colorRespaldo,size:0.34,sizeAttenuation:true,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthTest:true,depthWrite:false,toneMapped:false});recursos.materiales.push(m);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(posicionesHalo,3));g.computeBoundingSphere();recursos.geometrias.push(g);
    halosFocos=new THREE.Points(g,m);halosFocos.name='Halos focos biblioteca';pantallas.add(halosFocos);
  }

  // -----------------------------------------------------------
  // 09. COLOR POR CANCION Y DOS PULSOS SUAVES AL CAMBIAR
  // -----------------------------------------------------------
  function aplicarBrilloFocos(brillo){
    parpadeo.brillo=brillo;
    matBombillo.color.copy(colorBaseFocos).multiplyScalar(brillo);
    matLed.color.copy(colorBaseFocos).multiplyScalar(brillo);
    if(halosFocos){halosFocos.material.color.copy(colorBaseFocos);halosFocos.material.opacity=0.4*brillo;}
  }
  function actualizarColorCancion(parpadear=true){
    colorBaseFocos.set(playlist[indice]?.colorFocos??colorRespaldo);
    if(opciones.parpadeoFocos===false||movimientoReducido.matches){
      parpadeo.activo=false;parpadeo.tiempo=0;aplicarBrilloFocos(1);return;
    }
    const ahora=performance.now(),espera=Math.max(1500,parpadeo.duracion*1000+100);
    // Cambios rapidos conservan el pulso actual sin reiniciar destellos.
    if(parpadear&&!parpadeo.activo&&ahora-parpadeo.ultimoInicio>=espera){
      parpadeo.activo=true;parpadeo.tiempo=0;parpadeo.ultimoInicio=ahora;parpadeo.brillo=1;
    }
    aplicarBrilloFocos(parpadeo.activo?parpadeo.brillo:1);
  }
  function actualizarParpadeo(dt){
    if(!parpadeo.activo)return;
    if(opciones.parpadeoFocos===false||movimientoReducido.matches){parpadeo.activo=false;aplicarBrilloFocos(1);return;}
    parpadeo.tiempo+=Math.max(0,Number.isFinite(dt)?dt:0);
    const progreso=Math.min(parpadeo.tiempo/parpadeo.duracion,1);
    if(progreso>=1){parpadeo.activo=false;aplicarBrilloFocos(1);return;}
    const onda=0.5+0.5*Math.cos(progreso*Math.PI*2*parpadeo.pulsos);
    aplicarBrilloFocos(parpadeo.brilloMinimo+(1-parpadeo.brilloMinimo)*onda);
  }

  // -----------------------------------------------------------
  // 10. INTERFAZ COMPACTA: ANTERIOR, PLAY/PAUSA, SIGUIENTE
  // -----------------------------------------------------------
  const style=document.createElement('style');style.textContent=`
    #bc-abrir[hidden],#bc-panel[hidden]{display:none!important}
    #bc-abrir{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9;border:1px solid #4a453b;border-radius:22px;background:#181716ea;color:#d8d2c4;padding:9px 15px;font:600 12px system-ui;min-height:40px;cursor:pointer;touch-action:manipulation}
    #bc-panel{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;width:min(370px,calc(100vw - 24px));box-sizing:border-box;padding:11px 12px 10px;border:1px solid #4a453b;border-radius:14px;background:#181716f2;box-shadow:0 6px 24px #000a;color:#d8d2c4;font:13px system-ui;touch-action:pan-y}
    #bc-panel *{box-sizing:border-box}#bc-cabecera{display:flex;align-items:center;gap:8px;margin-bottom:8px}#bc-cabecera-textos{flex:1;min-width:0}
    #bc-etiqueta{display:block;color:#938d80;font-size:10px;letter-spacing:.06em;text-transform:uppercase}#bc-titulo{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;font-size:13px}
    #bc-cerrar{width:40px;min-height:40px;padding:0;border:0;background:transparent;color:#a8a294;font:24px system-ui;cursor:pointer;border-radius:8px;touch-action:manipulation}
    #bc-acciones{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:7px}#bc-acciones button{font:600 12px system-ui;min-height:44px;border:1px solid #3a3730;border-radius:9px;background:#262421;color:#e2ded0;cursor:pointer;touch-action:manipulation;padding:8px 5px}
    #bc-acciones #bc-play{background:#4a3f31;border-color:#6e5e49}#bc-acciones button:disabled{opacity:.35;cursor:default}#bc-estado{margin:7px 0 0;font-size:11px;color:#a8a294;line-height:1.3;max-height:2.6em;overflow:hidden}
    #bc-estado:empty{display:none}#bc-panel button:focus-visible,#bc-abrir:focus-visible{outline:2px solid #8c795b;outline-offset:2px}
    @media(max-height:440px){#bc-panel{bottom:8px;padding:8px 10px}#bc-cabecera{margin-bottom:4px}#bc-estado{margin-top:4px}}
  `;document.head.appendChild(style);
  const abrir=document.createElement('button');abrir.id='bc-abrir';abrir.type='button';abrir.textContent='Reproductor · R';abrir.hidden=true;document.body.appendChild(abrir);
  const panelUI=document.createElement('section');panelUI.id='bc-panel';panelUI.hidden=true;panelUI.setAttribute('role','dialog');panelUI.setAttribute('aria-modal','false');panelUI.setAttribute('aria-label','Controles de las pantallas');
  panelUI.innerHTML=`<div id="bc-cabecera"><div id="bc-cabecera-textos"><span id="bc-etiqueta">Biblioteca · Tres pantallas</span><span id="bc-titulo"></span></div><button type="button" id="bc-cerrar" aria-label="Ocultar controles y volver al juego" title="Ocultar sin pausar">×</button></div><div id="bc-acciones"><button type="button" id="bc-anterior">Anterior</button><button type="button" id="bc-play">Reproducir</button><button type="button" id="bc-siguiente">Siguiente</button></div><p id="bc-estado" role="status" aria-live="polite"></p>`;document.body.appendChild(panelUI);
  const $=id=>panelUI.querySelector('#'+id);
  const ponerMensaje=t=>{$('bc-estado').textContent=t;};
  function refrescarUI(){
    $('bc-titulo').textContent=playlist[indice]?.titulo||'Sin vídeos configurados';$('bc-play').textContent=video&&!video.paused?'Pausar':'Reproducir';
    $('bc-play').disabled=!habilitado||!playlist.length;$('bc-anterior').disabled=$('bc-siguiente').disabled=!habilitado||playlist.length<2;
  }

  // -----------------------------------------------------------
  // 11. DETECCION DE HABITACION Y PUERTA
  // -----------------------------------------------------------
  function posicionJugador(){castillo.updateWorldMatrix(true,false);inv.copy(castillo.matrixWorld).invert();return camara.getWorldPosition(posicion).applyMatrix4(inv);}
  function jugadorDentro(){
    const v=posicionJugador(),margen=estabaDentro?0.08:0;
    const dentro=v.x>-19.95-margen&&v.x<-7.05+margen&&v.z>-1.95-margen&&v.z<17.95+margen&&v.y>3&&v.y<9.95;estabaDentro=dentro;return dentro;
  }
  function cerca(){const v=posicionJugador();return enBiblioteca(v)||(Math.hypot(v.x+7,v.z-8)<3&&v.y>3&&v.y<10);}
  function puertaAbierta(){return Boolean(puerta.abierta&&Math.abs(puerta.angulo??puerta.pivote.rotation.y)>0.015);}
  function puedeUsarse(){return jugadorDentro()||puertaAbierta();}

  // -----------------------------------------------------------
  // 12. CARGA, REPRODUCCION Y CAMBIO DE CANCION
  // -----------------------------------------------------------
  function liberarVideo(){
    const anterior=video;video=null;
    if(anterior){if(playlist[indice])playlist[indice].tiempo=Number.isFinite(anterior.currentTime)?anterior.currentTime:0;anterior.pause();anterior.removeAttribute('src');anterior.load();anterior.remove();}
    if(texturaVideo){texturaVideo.dispose();texturaVideo=null;}screenMat.map=null;screenMat.color.setHex(0);screenMat.needsUpdate=true;
  }
  async function iniciar(v){
    if(!v||!puedeUsarse()||destruido)return;
    try{await v.play();if(video!==v||!puedeUsarse()||destruido){v.pause();return;}ponerMensaje('');refrescarUI();}
    catch(error){if(video===v&&!destruido){ponerMensaje(error.name==='NotAllowedError'?'Pulsa Reproducir para autorizar el vídeo.':'No se pudo reproducir el vídeo. Revisa la ruta y el formato.');refrescarUI();}}
  }
  function seleccionar(nuevoIndice,reproducir=false,desdeInicio=false){
    if(!puedeUsarse()||!playlist.length||destruido)return;
    habilitado=true;liberarVideo();indice=((nuevoIndice%playlist.length)+playlist.length)%playlist.length;
    const item=playlist[indice];if(desdeInicio)item.tiempo=0;
    // Color y parpadeo se actualizan en todos los caminos de seleccion.
    actualizarColorCancion(true);
    const v=document.createElement('video');video=v;v.crossOrigin='anonymous';v.playsInline=true;v.setAttribute('playsinline','');v.preload='metadata';
    v.volume=THREE.MathUtils.clamp(Number.isFinite(opciones.volumen)?opciones.volumen:0.7,0,1);
    v.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px';document.body.appendChild(v);
    v.addEventListener('loadedmetadata',()=>{
      if(video!==v||destruido)return;
      if(item.tiempo&&Number.isFinite(v.duration))v.currentTime=Math.min(item.tiempo,Math.max(0,v.duration-0.1));
      const aspecto=v.videoWidth/v.videoHeight||16/9;for(const s of monitores){const h=Math.min(s.h,s.w/aspecto);s.o.scale.set(h*aspecto,h,1);}
      if(v.paused)ponerMensaje('Listo para reproducir.');refrescarUI();
    });
    v.addEventListener('loadeddata',()=>{
      if(video!==v||destruido||!puedeUsarse())return;texturaVideo=new THREE.VideoTexture(v);texturaVideo.colorSpace=THREE.SRGBColorSpace;texturaVideo.generateMipmaps=false;texturaVideo.minFilter=texturaVideo.magFilter=THREE.LinearFilter;
      screenMat.map=texturaVideo;screenMat.color.setHex(0xffffff);screenMat.needsUpdate=true;
    },{once:true});
    v.addEventListener('play',refrescarUI);v.addEventListener('pause',refrescarUI);
    v.addEventListener('error',()=>{if(video===v&&!destruido)ponerMensaje('No se pudo cargar el vídeo. Revisa ruta, formato o CORS.');});
    v.addEventListener('ended',()=>{if(video!==v||!puedeUsarse())return;item.tiempo=0;if(playlist.length>1)seleccionar(indice+1,true,true);else{ponerMensaje('Vídeo finalizado.');refrescarUI();}});
    try{v.src=new URL(item.src,document.baseURI).href;v.load();ponerMensaje('Cargando…');refrescarUI();if(reproducir)iniciar(v);}catch{ponerMensaje('Ruta de vídeo inválida.');}
  }
  function reproducirPausar(){
    if(!puedeUsarse())return;if(!playlist.length){ponerMensaje('Configura vídeos en opciones.videos de main.js.');return;}
    if(!video){seleccionar(indice,true);return;}if(!video.paused){video.pause();ponerMensaje('En pausa.');refrescarUI();}else iniciar(video);
  }
  function cambiar(delta){if(playlist.length<2||!puedeUsarse())return;seleccionar(indice+delta,Boolean(video&&!video.paused),true);}

  // -----------------------------------------------------------
  // 13. PANEL, TECLADO Y REGRESO AL JUEGO SIN PAUSAR VIDEO
  // -----------------------------------------------------------
  function ocultarMenuDetras(){if(panelAbierto){const menu=document.getElementById('menu');if(menu)menu.hidden=true;}}
  function abrirPanel(){
    if(!puedeUsarse()||!cerca()||destruido)return;
    habilitado=true;panelAbierto=true;panelUI.hidden=false;abrir.hidden=true;controles?.pausar?.();
    if(document.pointerLockElement)document.exitPointerLock();ocultarMenuDetras();
    if(playlist.length&&!video)seleccionar(indice,false);refrescarUI();$('bc-play').focus();
  }
  function cerrarPanel(reanudar=true){panelAbierto=false;panelUI.hidden=true;if(reanudar)document.getElementById('boton-iniciar')?.click();}
  function tecla(e){
    if(e.repeat)return;
    if(panelAbierto&&(e.code==='Escape'||e.code==='KeyR')){e.preventDefault();cerrarPanel(true);return;}
    if(e.code==='KeyR'&&puedeUsarse()&&cerca()&&document.getElementById('menu')?.hidden){e.preventDefault();abrirPanel();}
  }
  function cambioPointerLock(){if(panelAbierto)queueMicrotask(ocultarMenuDetras);}
  function falloPointerLock(){if(!panelAbierto){const menu=document.getElementById('menu');if(menu)menu.hidden=false;}}
  function pausarOculto(){if(document.hidden)video?.pause();}
  abrir.addEventListener('click',abrirPanel);$('bc-cerrar').addEventListener('click',()=>cerrarPanel(true));$('bc-play').addEventListener('click',reproducirPausar);$('bc-anterior').addEventListener('click',()=>cambiar(-1));$('bc-siguiente').addEventListener('click',()=>cambiar(1));
  document.addEventListener('keydown',tecla);document.addEventListener('pointerlockchange',cambioPointerLock);document.addEventListener('pointerlockerror',falloPointerLock);document.addEventListener('visibilitychange',pausarOculto);

  // -----------------------------------------------------------
  // 14. ACTUALIZACION UNICA: USAR sala.actualizar(dt) EXISTENTE
  // -----------------------------------------------------------
  function actualizar(dt){
    if(destruido)return;
    actualizarParpadeo(dt);
    const dentro=jugadorDentro(),abierta=puertaAbierta(),activo=dentro||abierta;
    if(activo!==habilitado){
      habilitado=activo;
      if(!activo){liberarVideo();parpadeo.activo=false;aplicarBrilloFocos(1);if(panelAbierto)cerrarPanel(false);ponerMensaje('Fuera de la sala y puerta cerrada: sistema desactivado.');}
    }
    const visible=oclusion?.estadisticas?.habitacionesVisibles?.includes('Biblioteca')??true;
    pantallas.visible=habilitado&&(dentro||visible);
    if(dentro){for(const s of monitores)s.o.visible=true;for(const o of [marcos,leds,portafocos,focos])o.visible=true;if(halosFocos)halosFocos.visible=true;for(const o of revestimiento.children)o.visible=true;}
    if(video&&!dentro&&!visible&&!panelAbierto)video.pause();if(panelAbierto)ocultarMenuDetras();
    abrir.hidden=!habilitado||!cerca()||panelAbierto||!document.getElementById('menu')?.hidden;
    relojUI+=Math.max(0,Number.isFinite(dt)?dt:0);if(relojUI>=0.25){relojUI=0;refrescarUI();}
  }

  // -----------------------------------------------------------
  // 15. INICIALIZACION, API Y LIBERACION DE RECURSOS
  // -----------------------------------------------------------
  actualizarColorCancion(false); // No destellar al cargar la pagina.
  refrescarUI();
  return {
    actualizar,vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get activo(){return habilitado;},abrirPanel,cerrarPanel,
    get estadoFocos(){return {cancion:playlist[indice]?.titulo,color:colorBaseFocos.getHexString(),parpadeando:parpadeo.activo,brillo:parpadeo.brillo};},
    informe:{mueblesYLuminariasRetirados:eliminar.size,colisionesRetiradas,columnasRevestidas,pantallas:3,videoCompartido:true,puertaConMaterialOriginal:true,focosDecorativos:posicionesFocos.length,lucesDinamicasAdicionales:0,estilo:'Castillo oscuro, focos por cancion y dos pulsos suaves'},
    liberar(){
      if(destruido)return;destruido=true;liberarVideo();
      document.removeEventListener('keydown',tecla);document.removeEventListener('pointerlockchange',cambioPointerLock);document.removeEventListener('pointerlockerror',falloPointerLock);document.removeEventListener('visibilitychange',pausarOculto);
      abrir.remove();panelUI.remove();style.remove();pantallas.removeFromParent();revestimiento.removeFromParent();puerta.hoja.material=materialPuerta;
      portafocos.dispose();focos.dispose();
      for(const g of recursos.geometrias)g.dispose();for(const m of recursos.materiales)m.dispose();for(const t of recursos.texturas)t.dispose();
    }
  };
}
exports.crearSalaBibliotecaVideo = crearSalaBibliotecaVideo;
},
"./salaConsejoPoetica.js": function(module, exports, __require) {
const THREE = __THREE;


// Biblioteca de poesía: recursos dibujados localmente, sin APIs ni imágenes externas.
const POEMAS_CONSEJO = Object.freeze([
  {
    "titulo": "Donde empieza el reino",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "No hace falta una corona",
      "para un reino levantar;",
      "basta una luz en la ventana",
      "y alguien a quien regresar."
    ]
  },
  {
    "titulo": "La torre de la luna",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Sobre la torre dormida",
      "la luna dejó su voz:",
      "hay noches que son eternas",
      "si las compartimos dos."
    ]
  },
  {
    "titulo": "El puente del alba",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Un puente cruza la niebla,",
      "otro cruza el corazón;",
      "yo elegí seguir tus pasos",
      "sin pedirle al mapa razón."
    ]
  },
  {
    "titulo": "Jardín de piedra",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Entre las viejas murallas",
      "una flor quiso nacer;",
      "hasta la piedra más fría",
      "tiene algo que agradecer."
    ]
  },
  {
    "titulo": "El faro del invierno",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "Cuando el invierno oscurece",
      "los caminos hacia el mar,",
      "tu recuerdo enciende un faro",
      "que me enseña a regresar."
    ]
  },
  {
    "titulo": "Nuestro pequeño castillo",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Que el mundo guarde sus tronos,",
      "su oro y su inmensidad;",
      "yo prefiero una ventana",
      "donde verte despertar."
    ]
  },
  {
    "titulo": "La llave de cobre",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "No abre cofres ni tesoros,",
      "ni la puerta de un salón;",
      "esta llave tan pequeña",
      "abre nuestra conversación."
    ]
  },
  {
    "titulo": "Ventanas encendidas",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Cada ventana es un barco",
      "sobre un océano de cal;",
      "si dejas tu luz despierta,",
      "yo sabré dónde llegar."
    ]
  },
  {
    "titulo": "El bosque del silencio",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "El bosque guardó mi nombre",
      "bajo un abrigo de abril;",
      "lo pronunciaste muy bajo",
      "y volvió a vivir en mí."
    ]
  },
  {
    "titulo": "La rosa del patio",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Una rosa entre las losas",
      "no conoce de esplendor;",
      "le basta un poco de lluvia",
      "para regalar color."
    ]
  },
  {
    "titulo": "Campanas al regreso",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "Cuando suenan las campanas",
      "sobre la tarde de miel,",
      "cada nota me recuerda",
      "que aún puedo volver."
    ]
  },
  {
    "titulo": "La escalera del viento",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Subí buscando las nubes,",
      "bajé escuchando el jardín;",
      "a veces la mejor cima",
      "es quien espera por ti."
    ]
  },
  {
    "titulo": "El lago y la torre",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "En el agua de la tarde",
      "la torre aprende a bailar;",
      "lo que parece tan firme",
      "también se deja llevar."
    ]
  },
  {
    "titulo": "La carta sin sello",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Dejé una carta en tu libro,",
      "sin dirección ni papel:",
      "eran mis ganas de verte",
      "entre las líneas de ayer."
    ]
  },
  {
    "titulo": "La biblioteca dormida",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Duermen cien mundos abiertos",
      "bajo un techo de nogal;",
      "si una página despierta,",
      "nada vuelve a ser igual."
    ]
  },
  {
    "titulo": "Abrigo de estrellas",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "La noche olvidó su abrigo",
      "en la almena del balcón;",
      "lo tendimos sobre el miedo",
      "y el miedo se adormeció."
    ]
  },
  {
    "titulo": "La puerta entreabierta",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "No prometo días perfectos",
      "ni un cielo siempre de abril;",
      "sí una puerta entreabierta",
      "cuando quieras venir."
    ]
  },
  {
    "titulo": "El reloj del jardín",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "El reloj perdió sus horas",
      "entre lavanda y jazmín;",
      "desde entonces mide el tiempo",
      "por lo que nos hace reír."
    ]
  },
  {
    "titulo": "La fuente escondida",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "En un rincón del castillo",
      "canta una fuente sin rey;",
      "el agua no pide aplausos",
      "para enseñarnos a ser."
    ]
  },
  {
    "titulo": "Manos de primavera",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Traías frío en los dedos,",
      "yo una tarde de papel;",
      "juntamos nuestras dos manos",
      "y empezó a florecer."
    ]
  },
  {
    "titulo": "El dragón de papel",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Dibujamos un gran dragón",
      "en una hoja de color;",
      "no custodiaba riquezas,",
      "sino nuestro buen humor."
    ]
  },
  {
    "titulo": "El balcón del domingo",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Se quedó quieta la prisa",
      "al ver la plaza pasar;",
      "un domingo a nuestro lado",
      "aprendió a descansar."
    ]
  },
  {
    "titulo": "La nieve sobre el puente",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "La nieve cubrió los pasos",
      "que dejamos al volver;",
      "no pudo borrar la risa",
      "que trajimos de aquel mes."
    ]
  },
  {
    "titulo": "Lumbre en la cocina",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Lejos del salón del trono,",
      "junto al pan y al resplandor,",
      "descubrí que las historias",
      "también huelen a calor."
    ]
  },
  {
    "titulo": "La brújula pequeña",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "Mi brújula no señala",
      "las fronteras de un lugar;",
      "cuando pronuncias mi nombre,",
      "siempre empieza a girar."
    ]
  },
  {
    "titulo": "El hilo de la tarde",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Con un hilo de luz tibia",
      "la tarde cosió el balcón;",
      "nos quedamos en silencio",
      "para oír su corazón."
    ]
  },
  {
    "titulo": "Un reino sin murallas",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Si construimos un reino,",
      "que no encierre a nadie allí;",
      "que sus puertas sean caminos",
      "y haya sitio para ti."
    ]
  },
  {
    "titulo": "Los nombres del río",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "El río cambia de orilla",
      "sin dejar de ser canción;",
      "yo cambio un poco contigo",
      "sin perder mi dirección."
    ]
  },
  {
    "titulo": "El secreto de la hiedra",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "La hiedra sube despacio,",
      "no tiene nada que probar;",
      "hay abrazos que se quedan",
      "sin necesidad de hablar."
    ]
  },
  {
    "titulo": "El guardián del alba",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Un gorrión sobre la almena",
      "anunció que amaneció;",
      "sin espada ni armadura,",
      "a la sombra derrotó."
    ]
  },
  {
    "titulo": "Donde duermen las nubes",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "Las nubes bajan al valle",
      "cuando se cansa el azul;",
      "yo también busco un refugio",
      "en la calma que das tú."
    ]
  },
  {
    "titulo": "La mesa de los mapas",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Sobre la mesa extendimos",
      "un mapa sin terminar;",
      "dibujamos una casa",
      "y aprendimos a viajar."
    ]
  },
  {
    "titulo": "El eco de tus pasos",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Por el corredor de piedra",
      "ya no camina el temor;",
      "va siguiendo nuestros pasos",
      "un eco de buen humor."
    ]
  },
  {
    "titulo": "La lámpara del lector",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Una lámpara pequeña",
      "hace al invierno esperar;",
      "mientras exista una historia,",
      "queda un mundo por hallar."
    ]
  },
  {
    "titulo": "El pozo de los deseos",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "No arrojé ninguna moneda",
      "al pozo del viejo patio;",
      "pedí saber reconocer",
      "lo bueno que tengo al lado."
    ]
  },
  {
    "titulo": "La capa del viajero",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Mi capa guarda caminos,",
      "polvo, lluvia y un adiós;",
      "pero en su bolsillo llevo",
      "el calor de nuestra voz."
    ]
  },
  {
    "titulo": "Azul de medianoche",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "El cielo derrama tinta",
      "sobre el lomo del torreón;",
      "escribamos algo bueno",
      "antes de que salga el sol."
    ]
  },
  {
    "titulo": "La silla junto al fuego",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Hay una silla esperando",
      "junto al fuego del salón;",
      "no pregunta de qué huyes,",
      "solo ofrece su rincón."
    ]
  },
  {
    "titulo": "Un barco en la ventana",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Doblé un barco de papel",
      "y lo puse en el alféizar;",
      "no necesitaba un puerto,",
      "solo una ilusión sincera."
    ]
  },
  {
    "titulo": "El baile de las hojas",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "El otoño por el patio",
      "hizo una fiesta de cobre;",
      "cada hoja que caía",
      "parecía decir tu nombre."
    ]
  },
  {
    "titulo": "La canción del herrero",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "Bajo el golpe del martillo",
      "nace un ritmo de metal;",
      "también los días difíciles",
      "pueden algo bueno forjar."
    ]
  },
  {
    "titulo": "El espejo del estanque",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "El estanque no me exige",
      "ser distinto para entrar;",
      "me devuelve lo que encuentro",
      "cuando aprendo a mirar."
    ]
  },
  {
    "titulo": "La primera luciérnaga",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "Una chispa entre los juncos",
      "se atrevió a la oscuridad;",
      "no encendió todo el camino,",
      "pero nos hizo avanzar."
    ]
  },
  {
    "titulo": "El tapiz inacabado",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Nuestro tapiz tiene huecos,",
      "nudos y algún hilo gris;",
      "por eso cuenta una vida,",
      "no un dibujo sin matiz."
    ]
  },
  {
    "titulo": "Pan para el camino",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Lleva pan para el camino,",
      "una historia y buen humor;",
      "hay distancias que se acortan",
      "si se viaja con amor."
    ]
  },
  {
    "titulo": "El jardín de invierno",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Parecía que las ramas",
      "habían dejado de soñar;",
      "bajo el silencio del frío",
      "ya preparaban su brotar."
    ]
  },
  {
    "titulo": "La plaza sin corona",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "En la plaza nadie manda",
      "cuando empieza la canción;",
      "hasta el rey baja sus pasos",
      "al compás del acordeón."
    ]
  },
  {
    "titulo": "La escalera de caracol",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Cada vuelta de la escala",
      "me devuelve un mismo azul;",
      "no es volver al mismo sitio",
      "si en el viaje creces tú."
    ]
  },
  {
    "titulo": "La lluvia en los cristales",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "Escribió la lluvia un verso",
      "en el vidrio del salón;",
      "no supimos descifrarlo,",
      "pero el ruido nos unió."
    ]
  },
  {
    "titulo": "Un lugar en la mesa",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "No hace falta una gran fiesta",
      "ni vajilla de marfil;",
      "basta un sitio entre nosotros",
      "que guardamos para ti."
    ]
  },
  {
    "titulo": "El sendero de lavanda",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "La lavanda junto al muro",
      "perfuma incluso al pasar;",
      "hay personas que hacen eso:",
      "sin querer, nos hacen bien."
    ]
  },
  {
    "titulo": "La torre sin bandera",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Una torre sin bandera",
      "no ha perdido su valor;",
      "puede abrirse a todo el valle",
      "sin pedir un vencedor."
    ]
  },
  {
    "titulo": "El astrolabio quieto",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "Preguntamos a las estrellas",
      "por el rumbo de los dos;",
      "nos respondieron brillando,",
      "lo demás fue decisión."
    ]
  },
  {
    "titulo": "El cuaderno del regreso",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "En las páginas vacías",
      "no anoté lo que perdí;",
      "fui escribiendo los pequeños",
      "buenos días que viví."
    ]
  },
  {
    "titulo": "La sombra del cerezo",
    "subtitulo": "Biblioteca de los versos",
    "color": "#315f69",
    "cielo": "#183647",
    "acento": "#f2d49b",
    "motivo": "castillo",
    "versos": [
      "Bajo la sombra del árbol",
      "dejamos la discusión;",
      "las palabras, más despacio,",
      "encontraron otra voz."
    ]
  },
  {
    "titulo": "El secreto del umbral",
    "subtitulo": "Biblioteca de los versos",
    "color": "#594578",
    "cielo": "#19182f",
    "acento": "#e8d6ff",
    "motivo": "luna",
    "versos": [
      "Una casa se hace hogar",
      "cuando al cruzar su umbral",
      "ya no tienes que fingir",
      "que nunca te sale mal."
    ]
  },
  {
    "titulo": "El ala de la tarde",
    "subtitulo": "Biblioteca de los versos",
    "color": "#9a533e",
    "cielo": "#3e3d60",
    "acento": "#ffdaa8",
    "motivo": "puente",
    "versos": [
      "Una golondrina escribe",
      "su camino sobre el sol;",
      "yo no sé leer el cielo,",
      "pero entiendo su canción."
    ]
  },
  {
    "titulo": "Una taza y dos historias",
    "subtitulo": "Biblioteca de los versos",
    "color": "#41634a",
    "cielo": "#203b3b",
    "acento": "#e6dcab",
    "motivo": "jardin",
    "versos": [
      "Dos historias diferentes",
      "en la mesa coincidieron;",
      "entre una taza y la otra,",
      "nuevos capítulos nacieron."
    ]
  },
  {
    "titulo": "La última vela",
    "subtitulo": "Biblioteca de los versos",
    "color": "#335b87",
    "cielo": "#162b48",
    "acento": "#e3eeff",
    "motivo": "faro",
    "versos": [
      "Si se apaga la última vela,",
      "no termina la reunión;",
      "quedan brasas en la charla",
      "y calor en cada voz."
    ]
  },
  {
    "titulo": "Hasta la próxima página",
    "subtitulo": "Biblioteca de los versos",
    "color": "#85445d",
    "cielo": "#38223d",
    "acento": "#ffd5bd",
    "motivo": "castillo",
    "versos": [
      "Cierra el libro con cuidado,",
      "deja un hilo en el lugar;",
      "las historias compartidas",
      "siempre invitan a regresar."
    ]
  }
]);

function crearSalaConsejoPoetica(escena, camara, castillo, elemento, opciones = {}) {
  if (castillo.userData.consejoPoetico) return castillo.userData.consejoPoetico;
  const ROOM = 'Sala del consejo';
  const raiz = new THREE.Group();
  raiz.name = 'Consejo · Biblioteca de los versos';
  Object.assign(raiz.userData, { habitacion: ROOM, noAgrupar: true, dinamico: true });
  castillo.add(raiz);
  const geometrias = new Set(), materiales = new Set(), texturas = new Set();
  const obstaculosPropios = [], originalesOcultos = [], colisionesQuitadas = [];
  const colisiones = castillo.userData.colisiones;
  const geoCaja = new THREE.BoxGeometry(1, 1, 1); geometrias.add(geoCaja);
  const originalBox = new THREE.Box3(), inv = new THREE.Matrix4();
  castillo.updateMatrixWorld(true); inv.copy(castillo.matrixWorld).invert();
  const zona = new THREE.Box3(new THREE.Vector3(7.4, 3, -17.8), new THREE.Vector3(19.7, 9.8, -2.4));
  castillo.traverse(o => {
    if (!o.isMesh || !/^(Mesa|Armario)(\s|$)/i.test(o.name)) return;
    originalBox.setFromObject(o).applyMatrix4(inv);
    if (zona.containsBox(originalBox)) originalesOcultos.push({ objeto: o, visible: o.visible });
  });
  originalesOcultos.forEach(r => { r.objeto.visible = false; });
  if (Array.isArray(colisiones)) {
    const retirados = new Set(originalesOcultos.map(r => r.objeto));
    for (let i = colisiones.length - 1; i >= 0; i--) {
      if (retirados.has(colisiones[i].mesh)) colisionesQuitadas.push({ indice: i, valor: colisiones.splice(i, 1)[0] });
    }
  }
  function material(color, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }); materiales.add(m); return m;
  }
  const madera = material('#38251f'), borde = material('#644532'), oro = material('#cba75d', { metalness: 0.55, roughness: 0.42 });
  const tela = material('#663b4e'), marfil = material('#edddb7'), cuero = material(POEMAS_CONSEJO[0].color);
  const oscuro = material('#211c24');
  function marcar(o) { Object.assign(o.userData, { habitacion: ROOM, noAgrupar: true, dinamico: true }); return o; }
  function caja(nombre, x, y, z, w, h, d, mat, padre = raiz, solido = false) {
    const o = marcar(new THREE.Mesh(geoCaja, mat)); o.name = nombre; o.position.set(x,y,z); o.scale.set(w,h,d);
    o.castShadow = o.receiveShadow = true; padre.add(o);
    if (solido && Array.isArray(colisiones)) {
      const r = { mesh: o, w, h, d, esCaja: true }; colisiones.push(r); obstaculosPropios.push(r);
    }
    return o;
  }
  function cilindro(x,y,z,r,h,mat,padre=raiz) {
    const geo = new THREE.CylinderGeometry(r,r,h,16); geometrias.add(geo);
    const o = marcar(new THREE.Mesh(geo,mat)); o.position.set(x,y,z); o.castShadow = o.receiveShadow = true; padre.add(o); return o;
  }
  function canvas(ancho, alto) { const c = document.createElement('canvas'); c.width=ancho; c.height=alto; return c; }
  function textura(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texturas.add(t); return t; }
  function plano(c, w, h, x, y, z, ry=0, padre=raiz) {
    const geo = new THREE.PlaneGeometry(w,h); geometrias.add(geo);
    const mat = new THREE.MeshBasicMaterial({ map: textura(c), side: THREE.DoubleSide, toneMapped: false }); materiales.add(mat);
    const o = marcar(new THREE.Mesh(geo,mat)); o.position.set(x,y,z); o.rotation.y=ry; padre.add(o); return o;
  }
  function textoCentrado(ctx, texto, y, tam, ancho=420) {
    ctx.font = `${tam}px Georgia, serif`; const palabras=texto.split(' '); let linea='', lineas=[];
    for(const p of palabras) { const prueba=linea ? linea+' '+p : p; if(ctx.measureText(prueba).width>ancho && linea){lineas.push(linea);linea=p;}else linea=prueba; }
    if(linea)lineas.push(linea); ctx.textAlign='center';
    lineas.forEach((l,i)=>ctx.fillText(l,256,y+i*tam*1.2)); return y+lineas.length*tam*1.2;
  }
  function paisaje(ctx, p) {
    const grad=ctx.createLinearGradient(0,100,0,600); grad.addColorStop(0,p.cielo); grad.addColorStop(1,p.color);
    ctx.fillStyle=grad; ctx.fillRect(48,210,416,365);
    ctx.fillStyle=p.acento;
    for(let i=0;i<26;i++){ const x=62+(i*83%382), y=226+(i*47%170); ctx.globalAlpha=0.35+(i%3)*0.2; ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill(); }
    ctx.globalAlpha=1; ctx.beginPath();ctx.arc(p.motivo==='luna'?282:355,280,p.motivo==='luna'?42:25,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#15242c';ctx.beginPath();ctx.moveTo(48,500);ctx.lineTo(125,405);ctx.lineTo(215,470);ctx.lineTo(300,390);ctx.lineTo(464,500);ctx.lineTo(464,575);ctx.lineTo(48,575);ctx.fill();
    ctx.fillStyle='#0c1821';ctx.beginPath();ctx.moveTo(48,550);ctx.quadraticCurveTo(250,450,464,535);ctx.lineTo(464,575);ctx.lineTo(48,575);ctx.fill();
    const torre=(x,y,w,h)=>{ctx.fillStyle='#dbc79e';ctx.fillRect(x,y,w,h);for(let n=0;n<3;n++)ctx.fillRect(x+n*w/3,y-9,w/5,12);ctx.fillStyle='#f8d487';ctx.fillRect(x+w*.4,y+25,w*.2,19);};
    if(p.motivo==='puente') {
      ctx.strokeStyle='#d6b887';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(90,494);ctx.quadraticCurveTo(256,352,422,494);ctx.stroke();
      ctx.fillStyle='#d6b887';ctx.fillRect(118,465,17,80);ctx.fillRect(377,465,17,80);
      ctx.strokeStyle='#8ab8bd';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(165,530+i*6);ctx.lineTo(345,530+i*6);ctx.stroke();}
    } else if(p.motivo==='faro') {
      ctx.fillStyle='#e7d7b0';ctx.beginPath();ctx.moveTo(228,514);ctx.lineTo(244,345);ctx.lineTo(274,345);ctx.lineTo(289,514);ctx.fill();
      ctx.fillStyle=p.acento;ctx.fillRect(239,329,40,25);ctx.globalAlpha=.2;ctx.beginPath();ctx.moveTo(256,340);ctx.lineTo(452,277);ctx.lineTo(452,390);ctx.fill();ctx.globalAlpha=1;
    } else {
      torre(156,408,48,112);torre(307,408,48,112);torre(232,360,48,160);
      ctx.fillStyle='#d2b78d';ctx.fillRect(200,449,112,71);ctx.fillStyle='#24313a';ctx.beginPath();ctx.arc(256,492,15,Math.PI,0);ctx.lineTo(271,520);ctx.lineTo(241,520);ctx.fill();
      if(p.motivo==='jardin'){for(let i=0;i<11;i++){ctx.fillStyle=['#dbb0b5','#e6cf9d','#abbf92'][i%3];ctx.beginPath();ctx.arc(95+i*32,548-(i%3)*10,5,0,Math.PI*2);ctx.fill();}}
    }
  }
  function portada(p) {
    const c=canvas(512,768),ctx=c.getContext('2d');
    ctx.fillStyle=p.color;ctx.fillRect(0,0,512,768);ctx.strokeStyle=p.acento;ctx.lineWidth=3;ctx.strokeRect(22,22,468,724);ctx.lineWidth=1;ctx.strokeRect(32,32,448,704);
    ctx.fillStyle=p.acento;ctx.font='15px Georgia';ctx.textAlign='center';ctx.fillText('BIBLIOTECA DEL CONSEJO',256,72);
    textoCentrado(ctx,p.titulo,120,31,400);paisaje(ctx,p);
    ctx.strokeStyle=p.acento;ctx.strokeRect(48,210,416,365);ctx.fillStyle=p.acento;textoCentrado(ctx,p.subtitulo,627,21,395);
    ctx.font='14px Georgia';ctx.fillText('POEMAS PARA HABITAR UN CASTILLO',256,708);return c;
  }
  // Caché limitada: 60 portadas disponibles, como máximo cuatro texturas activas.
  const cachePortadas=new Map();
  function obtenerPortada(n) {
    if(cachePortadas.has(n)){
      const existente=cachePortadas.get(n);cachePortadas.delete(n);cachePortadas.set(n,existente);return existente;
    }
    const c=portada(POEMAS_CONSEJO[n]),t=textura(c),entrada={canvas:c,textura:t};cachePortadas.set(n,entrada);
    while(cachePortadas.size>4){const k=cachePortadas.keys().next().value;const viejo=cachePortadas.get(k);viejo.textura.dispose();texturas.delete(viejo.textura);cachePortadas.delete(k);}
    return entrada;
  }

  // Estanterías de madera con libros geométricos; sin descargas.
  let semilla=721; const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  const lomos=['#6b334c','#3d6566','#8a6a3f','#4e4976','#8e493c','#486247'].map(c=>material(c));
  function estanteria(x,z,ancho,rot=0) {
    const g=new THREE.Group();g.position.set(x,3,z);g.rotation.y=rot;raiz.add(g);
    caja('Consejo · Fondo de estantería',0,2.15,0,ancho,4.3,.65,madera,g,true);
    for(const dx of [-ancho/2,ancho/2])caja('Consejo · Columna',dx,2.15,.39,.14,4.5,.24,borde,g);
    for(let f=0;f<5;f++) {
      const y=.28+f*.82;caja('Consejo · Repisa',0,y,.43,ancho+.18,.12,.95,borde,g);
      let xLibro=-ancho/2+.15;
      while(xLibro<ancho/2-.22) {
        const w=.13+azar()*.15,h=.42+azar()*.25;
        caja('Consejo · Libro de estante',xLibro+w/2,y+.06+h/2,.43,w,h,.45,lomos[Math.floor(azar()*lomos.length)],g);
        caja('Consejo · Dorado del lomo',xLibro+w/2,y+.06+h*.75,.661,w*.74,.018,.012,oro,g);xLibro+=w+.035;
      }
    }
    caja('Consejo · Cornisa tallada',0,4.5,.08,ancho+.28,.22,1.02,oro,g);
  }
  estanteria(10.35,-17.15,4.25);estanteria(16.8,-17.15,4.25);
  estanteria(19.05,-5.65,4.5,-Math.PI/2);estanteria(19.05,-14.8,3.2,-Math.PI/2);

  // Alfombra y zócalos; se mantiene libre la puerta del oeste.
  const alf=canvas(512,512),ac=alf.getContext('2d');ac.fillStyle='#503044';ac.fillRect(0,0,512,512);
  for(const inset of [12,21,40]){ac.strokeStyle=inset===21?'#b48e56':'#806345';ac.lineWidth=3;ac.strokeRect(inset,inset,512-2*inset,512-2*inset);}
  ac.strokeStyle='#b48e56';ac.lineWidth=2;ac.beginPath();ac.moveTo(256,140);ac.lineTo(340,256);ac.lineTo(256,372);ac.lineTo(172,256);ac.closePath();ac.stroke();
  const alfombra=plano(alf,8.2,10.8,13.4,3.025,-9.7);alfombra.rotation.x=-Math.PI/2;
  caja('Consejo · Zócalo posterior',13.5,3.27,-17.52,12.3,.45,.15,borde);
  caja('Consejo · Zócalo oriental',19.51,3.27,-10,.15,.45,15,borde);

  // Atril central y libro tridimensional.
  caja('Consejo · Base del atril',13.6,3.18,-10.1,1.9,.32,1.45,madera,raiz,true);
  caja('Consejo · Pedestal',13.6,3.84,-10.1,1.12,1.05,.92,borde,raiz,true);
  caja('Consejo · Moldura de atril',13.6,4.41,-10.1,1.95,.15,1.45,oro);
  const libro=new THREE.Group();libro.position.set(13.6,5.49,-10.1);libro.rotation.y=-Math.PI/2;raiz.add(libro);marcar(libro);
  caja('Consejo · Páginas',0,0,0,1.62,2.02,.27,marfil,libro);
  caja('Consejo · Contraportada',0,0,-.17,1.77,2.16,.07,cuero,libro);
  caja('Consejo · Lomo',-.865,0,0,.1,2.16,.4,cuero,libro);
  for(const y of [-.84,-.67,.67,.84])caja('Consejo · Nervio dorado',-.923,y,0,.02,.035,.41,oro,libro);
  const hoja=canvas(512,768), hc=hoja.getContext('2d');
  const pagina=plano(hoja,1.56,1.96,0,0,.141,0,libro);
  const pivote=new THREE.Group();pivote.position.set(-.885,0,.2);libro.add(pivote);marcar(pivote);
  caja('Consejo · Tapa móvil',.885,0,0,1.77,2.16,.075,cuero,pivote);
  const geoPortada=new THREE.PlaneGeometry(1.7,2.09);geometrias.add(geoPortada);
  const matPortada=new THREE.MeshBasicMaterial({map:obtenerPortada(0).textura,toneMapped:false});materiales.add(matPortada);
  const caratula=marcar(new THREE.Mesh(geoPortada,matPortada));caratula.position.set(.885,0,.04);pivote.add(caratula);
  function pintarPagina(p) {
    hc.fillStyle='#f4e7c9';hc.fillRect(0,0,512,768);
    hc.strokeStyle='#a78c53';hc.lineWidth=2;hc.strokeRect(25,25,462,718);
    hc.fillStyle='#40313c';textoCentrado(hc,p.titulo,115,30,416);
    hc.font='25px Georgia';hc.textAlign='center';
    let y=280;
    for(const verso of p.versos){
      let linea='';
      for(const palabra of verso.split(' ')){
        const prueba=linea?linea+' '+palabra:palabra;
        if(linea && hc.measureText(prueba).width>425){hc.fillText(linea,256,y);y+=35;linea=palabra;}else linea=prueba;
      }
      if(linea){hc.fillText(linea,256,y);y+=45;}
    }
    hc.font='15px Georgia';hc.fillStyle='#8c754c';hc.fillText('BIBLIOTECA DE LOS VERSOS',256,688);
    pagina.material.map.needsUpdate=true;
  }
  pintarPagina(POEMAS_CONSEJO[0]);

  // CONSEJO_LIBRO_ABIERTO_60_V2: acabados locales, sin teñir materiales compartidos.
  const paredConsejo=material('#244a4d',{roughness:.94});
  const matSueloConsejo=material('#aa916b',{roughness:.88});
  caja('Consejo · Pared verde petróleo posterior',13.5,6.5,-17.585,12.3,6.96,.018,paredConsejo);
  caja('Consejo · Pared verde petróleo este',19.585,6.5,-9.96,.018,6.96,15.25,paredConsejo);
  caja('Consejo · Pared verde petróleo frontal',13.5,6.5,-2.315,12.3,6.96,.018,paredConsejo);
  // La puerta oeste conserva su hueco de 2,6 m y su dintel.
  caja('Consejo · Pared oeste norte',7.335,6.5,-14.5,.018,6.96,6.34,paredConsejo);
  caja('Consejo · Pared oeste sur',7.335,6.5,-5.5,.018,6.96,6.34,paredConsejo);
  caja('Consejo · Dintel verde',7.335,8.3,-10,.018,3.36,2.66,paredConsejo);
  const pisoConsejo=caja('Consejo · Piso roble miel',13.46,3.007,-9.98,12.20,.01,15.22,matSueloConsejo);
  const vetas=canvas(512,512),vc=vetas.getContext('2d');vc.fillStyle='#b79c75';vc.fillRect(0,0,512,512);
  for(let fila=0;fila<8;fila++){
    const yy=fila*64;vc.fillStyle=fila%2?'#b99d77':'#ac906b';vc.fillRect(0,yy,512,64);
    vc.strokeStyle='#7c654c';vc.lineWidth=2;vc.strokeRect(0,yy,512,64);
    vc.beginPath();vc.moveTo((fila%3)*170+36,yy);vc.lineTo((fila%3)*170+36,yy+64);vc.stroke();
    vc.strokeStyle='#7f664530';vc.lineWidth=1;
    for(let j=0;j<8;j++){vc.beginPath();vc.moveTo(0,yy+9+j*6);vc.bezierCurveTo(170,yy+3+j*6,340,yy+15+j*6,512,yy+8+j*6);vc.stroke();}
  }
  const mapaPiso=textura(vetas);mapaPiso.wrapS=mapaPiso.wrapT=THREE.RepeatWrapping;mapaPiso.repeat.set(3,4);matSueloConsejo.map=mapaPiso;matSueloConsejo.color.set('#ffffff');matSueloConsejo.needsUpdate=true;
  // La tapa interior izquierda lleva la ilustración; el poema aparece a la derecha.
  const geoInterior=new THREE.PlaneGeometry(1.64,2.02);geometrias.add(geoInterior);
  const matInterior=new THREE.MeshBasicMaterial({map:obtenerPortada(0).textura,toneMapped:false});materiales.add(matInterior);
  const interior=marcar(new THREE.Mesh(geoInterior,matInterior));interior.position.set(.885,0,-.044);interior.rotation.y=Math.PI;pivote.add(interior);
  pagina.material.transparent=true;pagina.material.opacity=0;pagina.material.depthWrite=false;
  const pivoteHoja=new THREE.Group();pivoteHoja.position.set(-.81,0,.16);libro.add(pivoteHoja);
  const geoHoja=new THREE.PlaneGeometry(1.62,2.02);geometrias.add(geoHoja);
  const matHoja=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});materiales.add(matHoja);
  const hojaMovil=marcar(new THREE.Mesh(geoHoja,matHoja));hojaMovil.position.x=.81;pivoteHoja.add(hojaMovil);


  function sillon(x,z,rot) {
    const g=new THREE.Group();g.position.set(x,3,z);g.rotation.y=rot;raiz.add(g);
    caja('Consejo · Butaca',0,.48,0,1.3,.65,1.25,tela,g,true);
    caja('Consejo · Respaldo',0,1.08,-.53,1.3,1.1,.23,tela,g);
    for(const dx of [-.68,.68])caja('Consejo · Brazo tallado',dx,.85,0,.16,.55,1.2,borde,g);
    for(const dx of [-.49,.49])for(const dz of [-.43,.43])caja('Consejo · Pata',dx,.14,dz,.12,.28,.12,oro,g);
  }
  sillon(10.2,-5.1,Math.PI/2);sillon(16.5,-5.1,-Math.PI/2);
  caja('Consejo · Mesa de lectura',13.35,3.68,-5.1,1.55,1.32,1.2,madera,raiz,true);
  caja('Consejo · Tapa de mesa',13.35,4.39,-5.1,1.8,.12,1.4,borde);
  for(let i=0;i<3;i++)caja('Consejo · Volumen apilado',13.4,4.52+i*.12,-5.1,.7,.1,.49,lomos[i]);

  // Cartela, cuadro y lámpara ornamental.
  const cartel=canvas(512,256),cc=cartel.getContext('2d');cc.fillStyle='#302831';cc.fillRect(0,0,512,256);cc.strokeStyle='#cba75d';cc.lineWidth=5;cc.strokeRect(12,12,488,232);cc.fillStyle='#eddbb6';
  textoCentrado(cc,'LA BIBLIOTECA',93,35);textoCentrado(cc,'DE LOS VERSOS',145,30);cc.font='17px Georgia';cc.fillText('SALA DEL CONSEJO',256,210);
  plano(cartel,3.4,1.7,13.5,8.3,-17.53);
  const arte=portada(POEMAS_CONSEJO[1]);caja('Consejo · Marco del cuadro',19.48,6.3,-9.1,.12,3.0,2.08,oro);
  plano(arte,1.9,2.82,19.40,6.3,-9.1,-Math.PI/2);
  const llama=material('#ffe2a0',{emissive:'#ffb85b',emissiveIntensity:1.4});
  const geoLlama=new THREE.SphereGeometry(.065,8,6);geometrias.add(geoLlama);
  function vela(x,y,z) {
    cilindro(x,y+.17,z,.065,.34,marfil);cilindro(x,y-.025,z,.14,.06,oro);
    const f=marcar(new THREE.Mesh(geoLlama,llama));f.position.set(x,y+.39,z);f.scale.y=1.9;raiz.add(f);
  }
  cilindro(13.6,8.4,-10.1,1.12,.09,oro);
  cilindro(13.6,9.0,-10.1,.028,1.15,oro);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;vela(13.6+Math.cos(a)*1.03,8.48,-10.1+Math.sin(a)*1.03);}
  vela(12.8,4.5,-5.1);vela(14.3,4.5,-5.1);
  const luz=new THREE.PointLight(0xffd39c,23,12,2);luz.position.set(13.6,7.4,-10.1);luz.castShadow=false;raiz.add(luz);marcar(luz);

  // Libros estáticos agrupados por material para reducir llamadas de dibujo.
  raiz.updateWorldMatrix(true,true);
  const inversaRaiz=new THREE.Matrix4().copy(raiz.matrixWorld).invert();
  const lotes=new Map(),aRetirar=[];
  raiz.traverse(o=>{
    if(!o.isMesh || !/^Consejo · (Libro de estante|Dorado del lomo)$/.test(o.name))return;
    if(!lotes.has(o.material))lotes.set(o.material,[]);
    lotes.get(o.material).push(new THREE.Matrix4().multiplyMatrices(inversaRaiz,o.matrixWorld));
    aRetirar.push(o);
  });
  aRetirar.forEach(o=>o.removeFromParent());
  for(const [mat,matrices] of lotes){
    const lote=marcar(new THREE.InstancedMesh(geoCaja,mat,matrices.length));
    lote.name='Consejo · Libros agrupados';lote.castShadow=lote.receiveShadow=true;
    matrices.forEach((m,i)=>lote.setMatrixAt(i,m));lote.instanceMatrix.needsUpdate=true;
    lote.computeBoundingSphere();raiz.add(lote);
  }

  // Lector sobre el escenario: el libro real permanece a la vista.
  const id='consejo-poetico';
  const estilo=document.createElement('style');estilo.textContent=`
  #${id}[hidden],#${id}-abrir[hidden],#${id} [hidden]{display:none!important}
  #${id}{position:fixed;inset:0;z-index:30000;background:transparent;display:flex;align-items:flex-end;justify-content:center;padding:14px;box-sizing:border-box;color:#f6e8cc;font-family:Georgia,serif}
  #${id} *{box-sizing:border-box}
  #${id} .cp-hud{width:min(850px,100%);padding:15px 18px;border:1px solid #b49b65;border-radius:16px;background:#17272aee;box-shadow:0 10px 45px #0008;max-height:60dvh;overflow:auto;overscroll-behavior:contain}
  #${id} .cp-barra{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  #${id} h2{font-size:18px;margin:0 0 5px;color:#ffe5ac}
  #${id} .cp-estado{font:12px/1.4 system-ui,sans-serif;color:#ccc2ac;margin:0}
  #${id} button,#${id}-abrir{font:14px system-ui,sans-serif;min-height:44px;background:#263e40;color:#f6e8cc;border:1px solid #b19a63;padding:10px 14px;border-radius:9px;cursor:pointer;touch-action:manipulation}
  #${id} button:disabled{opacity:.45;cursor:wait}
  #${id} button:hover,#${id}-abrir:hover{background:#3c5654}
  #${id} button:focus-visible,#${id}-abrir:focus-visible{outline:3px solid #f6ce74;outline-offset:3px}
  #${id} .cp-acciones{display:flex;gap:8px;flex-wrap:wrap}
  #${id} .cp-versos{white-space:pre-line;text-align:center;font-size:clamp(18px,3vw,24px);line-height:1.8;margin:16px 0 6px}
  #${id}-abrir{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:25;max-width:90vw;background:#183537ee}
  @media(max-width:600px){#${id}{padding:7px}#${id} .cp-hud{padding:12px}#${id} h2{font-size:16px}#${id} button{padding:9px 10px;font-size:12px}.cp-acciones{width:100%;justify-content:center}}
  `;document.head.appendChild(estilo);
  const panel=document.createElement('section');panel.id=id;panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Libro de poemas de la Sala del Consejo');
  panel.innerHTML=`<div class="cp-hud"><div class="cp-barra"><div><h2>Biblioteca de los versos</h2><p class="cp-estado" role="status" aria-live="polite"></p></div><div class="cp-acciones"><button type="button" class="cp-anterior">← Anterior</button><button type="button" class="cp-siguiente">Siguiente →</button><button type="button" class="cp-texto" aria-expanded="false">Ampliar texto</button><button type="button" class="cp-cerrar">Cerrar libro</button></div></div><p class="cp-versos" hidden></p></div>`;
  document.body.appendChild(panel);
  const abrirBtn=document.createElement('button');abrirBtn.id=id+'-abrir';abrirBtn.type='button';abrirBtn.hidden=true;abrirBtn.textContent='R · Abrir el libro del consejo';document.body.appendChild(abrirBtn);
  const titulo=panel.querySelector('h2'),aviso=panel.querySelector('.cp-estado'),versos=panel.querySelector('.cp-versos');
  const anterior=panel.querySelector('.cp-anterior'),siguiente=panel.querySelector('.cp-siguiente'),textoBtn=panel.querySelector('.cp-texto'),cerrarBtn=panel.querySelector('.cp-cerrar');
  const menu=document.getElementById('menu');
  let controles=null,oclusion=null,indice=0,abierto=false,liberado=false,cerca=false;
  let fase='cerrado',tiempo=0,transicion=null,recuerdo=null,camino=null,anguloSalida=0;
  const reducido=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const localCam=new THREE.Vector3(),centroLibro=new THREE.Vector3(13.6,5.49,-10.1);
  const anguloAbierto=-2.90;
  const suavizar=p=>p*p*(3-2*p);
  function interfaz(){
    const listo=fase==='abierto'&&!transicion;
    titulo.textContent=listo?POEMAS_CONSEJO[indice].titulo:'Biblioteca de los versos';
    aviso.textContent=fase==='abriendo'?'Abriendo el libro…':fase==='cerrando'?'Cerrando el libro…':transicion?'Pasando la página…':`${indice+1} / ${POEMAS_CONSEJO.length} · Poema · Flechas para cambiar`;
    anterior.disabled=siguiente.disabled=textoBtn.disabled=!listo;
    versos.textContent=listo?POEMAS_CONSEJO[indice].versos.join('\n'):'';
    if(!listo){versos.hidden=true;textoBtn.setAttribute('aria-expanded','false');}
  }
  function aplicarIndice(n){
    indice=n;const p=POEMAS_CONSEJO[n],entrada=obtenerPortada(n);
    cuero.color.set(p.color);matPortada.map=entrada.textura;matInterior.map=entrada.textura;matPortada.needsUpdate=matInterior.needsUpdate=true;
    pintarPagina(p);
  }
  function enfocar(){
    libro.updateWorldMatrix(true,true);
    const aspecto=Math.max(.25,camara.aspect),fov=THREE.MathUtils.degToRad(camara.fov);
    const distancia=THREE.MathUtils.clamp(1.95/(Math.tan(fov/2)*aspecto)+.5,3.4,5.65);
    const objetivo=libro.localToWorld(new THREE.Vector3(-.78,-.04,0));
    const posicion=libro.localToWorld(new THREE.Vector3(-.78,.10,distancia));
    const matriz=new THREE.Matrix4().lookAt(posicion,objetivo,camara.up);
    const q=new THREE.Quaternion().setFromRotationMatrix(matriz);
    if(camara.parent){camara.parent.updateWorldMatrix(true,false);camara.parent.worldToLocal(posicion);q.premultiply(camara.parent.getWorldQuaternion(new THREE.Quaternion()).invert());}
    return {posicion,quaternion:q};
  }
  function moverCamara(p,desde,hasta){
    const s=suavizar(p);camara.position.lerpVectors(desde.posicion,hasta.posicion,s);camara.quaternion.slerpQuaternions(desde.quaternion,hasta.quaternion,s);
  }
  function abrir(){
    if(liberado||!cerca||abierto)return;
    recuerdo={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};
    camino=enfocar();abierto=true;fase='abriendo';tiempo=0;
    controles?.pausar?.();
    if(document.pointerLockElement){try{const p=document.exitPointerLock();p?.catch?.(()=>{});}catch{}}
    pagina.material.opacity=0;pivote.rotation.y=0;panel.hidden=false;abrirBtn.hidden=true;if(menu)menu.hidden=true;
    interfaz();cerrarBtn.focus();
  }
  function terminarCierre(){
    if(recuerdo){camara.position.copy(recuerdo.posicion);camara.quaternion.copy(recuerdo.quaternion);}
    pivote.rotation.y=0;pagina.material.opacity=0;matHoja.opacity=0;
    if(transicion?.textura){transicion.textura.dispose();texturas.delete(transicion.textura);}transicion=null;
    matHoja.map=null;fase='cerrado';abierto=false;panel.hidden=true;recuerdo=null;camino=null;
    if(menu){menu.hidden=false;document.getElementById('boton-iniciar')?.focus();}
  }
  function cerrar(){
    if(!abierto||fase==='cerrando')return;
    if(transicion?.textura){transicion.textura.dispose();texturas.delete(transicion.textura);}transicion=null;matHoja.map=null;matHoja.opacity=0;
    pagina.material.opacity=0;anguloSalida=pivote.rotation.y;
    camino={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};
    fase='cerrando';tiempo=0;interfaz();
  }
  function cambiar(direccion){
    if(liberado||fase!=='abierto'||transicion)return;
    const n=(indice+direccion+POEMAS_CONSEJO.length)%POEMAS_CONSEJO.length;
    if(reducido){aplicarIndice(n);interfaz();return;}
    const copia=canvas(512,768);copia.getContext('2d').drawImage(hoja,0,0);
    const t=textura(copia);matHoja.map=t;matHoja.needsUpdate=true;matHoja.opacity=1;matHoja.depthWrite=true;pivoteHoja.rotation.y=0;
    transicion={t:0,n,cambiado:false,textura:t,direccion};interfaz();
  }
  function teclado(e){
    if(abierto){
      if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
      if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)cambiar(e.code==='ArrowLeft'?-1:1);return;}
      if(e.code==='Tab'){
        const botones=[...panel.querySelectorAll('button:not(:disabled)')],primero=botones[0],ultimo=botones[botones.length-1];
        if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}
        else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
      }
      if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','Space','ShiftLeft','ControlLeft'].includes(e.code))e.stopImmediatePropagation();
    }else if(e.code==='KeyR'&&cerca&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable&&(!menu||menu.hidden||document.pointerLockElement===elemento)){
      e.preventDefault();e.stopImmediatePropagation();abrir();
    }
  }
  abrirBtn.addEventListener('click',abrir);cerrarBtn.addEventListener('click',cerrar);anterior.addEventListener('click',()=>cambiar(-1));siguiente.addEventListener('click',()=>cambiar(1));
  textoBtn.addEventListener('click',()=>{if(fase!=='abierto'||transicion)return;versos.hidden=!versos.hidden;textoBtn.setAttribute('aria-expanded',String(!versos.hidden));textoBtn.textContent=versos.hidden?'Ampliar texto':'Ocultar texto';});
  document.addEventListener('keydown',teclado,true);
  function alDesbloquear(){if(abierto&&menu)menu.hidden=true;}
  document.addEventListener('pointerlockchange',alDesbloquear);
  function actualizar(dt=0){
    if(liberado)return;
    const paso=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));
    castillo.updateWorldMatrix(true,false);camara.getWorldPosition(localCam);castillo.worldToLocal(localCam);
    const dentro=localCam.x>7.3&&localCam.x<19.7&&localCam.z> -17.7&&localCam.z< -2.3&&localCam.y>3&&localCam.y<9.8;
    cerca=dentro&&localCam.distanceTo(centroLibro)<(opciones.distanciaLectura??4.6);
    const visible=abierto||(oclusion?.habitaciones?.find(h=>h.id===ROOM)?.visible??true);raiz.visible=visible;luz.visible=visible;
    abrirBtn.hidden=!cerca||abierto||Boolean(menu&&!menu.hidden);
    if(fase==='abriendo'){
      tiempo+=paso;const p=Math.min(1,tiempo/(reducido ? .001 : 1.15));
      pivote.rotation.y=anguloAbierto*suavizar(p);moverCamara(p,recuerdo,camino);
      if(p===1){fase='abierto';aplicarIndice(indice);pagina.material.opacity=1;interfaz();}
    }else if(fase==='cerrando'){
      tiempo+=paso;const p=Math.min(1,tiempo/(reducido ? .001 : .85));pivote.rotation.y=anguloSalida*(1-suavizar(p));moverCamara(p,camino,recuerdo);
      if(p===1)terminarCierre();
    }
    if(transicion){
      transicion.t+=paso;const p=Math.min(1,transicion.t/.85);
      // La hoja física cruza el lomo; el nuevo poema aparece debajo.
      pivoteHoja.rotation.y=-Math.PI*suavizar(p);
      if(p>=.5&&!transicion.cambiado){transicion.cambiado=true;aplicarIndice(transicion.n);}
      if(p===1){matHoja.opacity=0;matHoja.depthWrite=false;matHoja.map=null;transicion.textura.dispose();texturas.delete(transicion.textura);transicion=null;pivoteHoja.rotation.y=0;interfaz();}
    }
    if(abierto&&menu&&!menu.hidden)menu.hidden=true;
  }
  const api={raiz,libro,poemas:POEMAS_CONSEJO,actualizar,abrir,cerrar,
    siguiente:()=>cambiar(1),anterior:()=>cambiar(-1),
    vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get indice(){return indice;},get abierto(){return abierto;},get fase(){return fase;},
    liberar(){
      if(liberado)return;if(abierto)terminarCierre();liberado=true;
      document.removeEventListener('keydown',teclado,true);document.removeEventListener('pointerlockchange',alDesbloquear);
      panel.remove();abrirBtn.remove();estilo.remove();raiz.removeFromParent();
      if(Array.isArray(colisiones)){
        for(const r of obstaculosPropios){const i=colisiones.indexOf(r);if(i>=0)colisiones.splice(i,1);}
        colisionesQuitadas.sort((a,b)=>a.indice-b.indice).forEach(r=>colisiones.splice(Math.min(r.indice,colisiones.length),0,r.valor));
      }
      originalesOcultos.forEach(r=>r.objeto.visible=r.visible);
      for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();cachePortadas.clear();
      delete castillo.userData.consejoPoetico;
    }
  };
  castillo.userData.consejoPoetico=api;return api;
}

exports.POEMAS_CONSEJO = POEMAS_CONSEJO;
exports.crearSalaConsejoPoetica = crearSalaConsejoPoetica;
},
"./escena.js": function(module, exports, __require) {
const THREE = __THREE;
const { CONFIG } = __require("./config.js");



function crearEscena(contenedor) {
  const escena=new THREE.Scene();
  escena.background=new THREE.Color(CONFIG.ambiente.cielo);
  escena.fog=new THREE.Fog(CONFIG.ambiente.cielo,CONFIG.ambiente.nieblaCerca,CONFIG.ambiente.nieblaLejos);
  const camara=new THREE.PerspectiveCamera(CONFIG.camara.fov,window.innerWidth/window.innerHeight,0.15,CONFIG.camara.lejos);
  camara.position.set(CONFIG.jugador.posicionInicial.x,CONFIG.jugador.altura,CONFIG.jugador.posicionInicial.z);
  camara.lookAt(0,CONFIG.jugador.altura,0);
  const renderizador=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio,1));
  renderizador.setSize(window.innerWidth,window.innerHeight);
  renderizador.outputColorSpace=THREE.SRGBColorSpace;
  renderizador.toneMapping=THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure=1;
  renderizador.shadowMap.enabled=true;
  renderizador.shadowMap.type=THREE.PCFSoftShadowMap;
  contenedor.appendChild(renderizador.domElement);
  // Esta luz ilumina tambien interiores: mantener moderada para evitar lavarlos.
  const ambiente=new THREE.HemisphereLight(0xe0edff,0x676044,0.65);escena.add(ambiente);
  const sol=new THREE.DirectionalLight(0xffead2,2.2);
  sol.name='Sol principal';sol.position.set(-35,65,15);
  sol.target.position.set(0,10,-20);escena.add(sol,sol.target);
  sol.castShadow=true;sol.shadow.mapSize.set(1024,1024);
  Object.assign(sol.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});
  sol.shadow.camera.updateProjectionMatrix();
  // Valores iniciales, no una correccion universal para cualquier artefacto.
  sol.shadow.bias=-0.00015;sol.shadow.normalBias=0.035;
  function redimensionar() {
    camara.aspect=window.innerWidth/window.innerHeight;camara.updateProjectionMatrix();
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio,1));
    renderizador.setSize(window.innerWidth,window.innerHeight);
  }
  window.addEventListener('resize',redimensionar);
  return {escena,camara,renderizador};
}

exports.crearEscena = crearEscena;
},
"./comedorRompecabezas.js": function(module, exports, __require) {
const THREE = __THREE;


// =============================================================
// COMEDOR PERSONALIZADO: IMAGENES REALES + GUIAS APAGADAS EN NEGRO
// Sustituye el modulo anterior sin cambiar su API para main.js.
// =============================================================
function crearComedorRompecabezas(escena, camara, castillo, elemento, opciones = {}) {
  // 01. CONFIGURACION, RUTAS Y ESTADO.
  const puerta=castillo.userData.puertas.find(p=>p.nombre==='Comedor');
  if(!puerta)throw new Error('No se encontró la puerta Comedor.');
  const recursos={geometrias:new Set(),materiales:new Set(),texturas:new Set()};
  const niveles=[{titulo:'Fácil · 9 piezas',cols:3,filas:3},{titulo:'Medio · 12 piezas',cols:4,filas:3},{titulo:'Difícil · 16 piezas',cols:4,filas:4}];
  const baseCarpeta=new URL(opciones.carpetaImagenes||'./assets/imagen/rompecabezas/',document.baseURI);
  if(!baseCarpeta.pathname.endsWith('/'))baseCarpeta.pathname+='/';
  const urlCatalogo=new URL(opciones.catalogoImagenes||'imagenes.json',baseCarpeta);
  const cacheImagenes=new Map();
  let catalogo=[],cargandoCatalogo=false,promesaCatalogo=null,versionCatalogo=0;
  let controles=null,oclusion=null,abierto=false,destruido=false;
  const inv=new THREE.Matrix4(),local=new THREE.Vector3();castillo.updateMatrixWorld(true);inv.copy(castillo.matrixWorld).invert();
  const protegidos=new Set();puerta.marco.traverse(o=>protegidos.add(o));
  const dentro=v=>v.x>7.05&&v.x<19.95&&v.z>-1.95&&v.z<17.95&&v.y>3&&v.y<9.95;
  const paleta=[0x31b4ae,0xe5bc59,0xdc8a70,0x729bb8];
  const CW=1000,CH=1200;
  let W=580,H=580*2/3,BX=210,BY=55,COLS=3,FILAS=3,PW=W/3,PH=H/3;
  let imagen=null,piezas=[],seleccionada=null,arrastre=null,referencia=opciones.mostrarGuias===true,iniciado=false;
  let retoActual=0,nivelActual=0,resueltas=0,movimientos=0,tiempoAcumulado=0,inicioTiempo=0,relojUI=0,terminado=false;
  let cargandoImagen=false,versionPartida=0,solicitudImagen=null;
  const abortarCatalogo=new AbortController();

  // 02. VACIAR SOLO MUEBLES Y LUMINARIAS DEL COMEDOR.
  const retirar=new Set(),muebles=/^(Mesa|Armario|Estanteria|Libros|Cama|Cabecera|Cadena candelabro|Brazo candelabro|Vela|Soporte antorcha)/i;
  castillo.traverse(o=>{
    if(protegidos.has(o))return;o.getWorldPosition(local).applyMatrix4(inv);if(!dentro(local))return;
    if(o.isPointLight||(o.isMesh&&muebles.test(o.name))){retirar.add(o);return;}
    if(o.isMesh&&o.material){const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m?.emissive&&m.emissive.r>.2&&m.emissive.r>m.emissive.g))retirar.add(o);}
  });
  const descendientes=new Set();for(const o of retirar)o.traverse(c=>descendientes.add(c));
  const colisiones=castillo.userData.colisiones;let colisionesRetiradas=0;
  for(let i=colisiones.length-1;i>=0;i--)if(descendientes.has(colisiones[i].mesh)){colisiones.splice(i,1);colisionesRetiradas++;}
  for(const o of retirar)o.removeFromParent();
  const cierre=castillo.getObjectByName('Cierre frontal derecho');
  if(cierre){const min=cierre.position.x-cierre.scale.x/2,max=cierre.position.x+cierre.scale.x/2;
    if(min<20){const ancho=Math.max(0,max-20);
      if(ancho>.01){cierre.scale.x=ancho;cierre.position.x=20+ancho/2;for(const c of colisiones)if(c.mesh===cierre)c.w=ancho;cierre.updateMatrix();cierre.updateWorldMatrix(true,false);}
      else{for(let i=colisiones.length-1;i>=0;i--)if(colisiones[i].mesh===cierre)colisiones.splice(i,1);cierre.removeFromParent();}
    }
  }

  // 03. FORMAS Y TEXTURAS TEMATICAS DE LA HABITACION.
  function signo(c,r,t){return(c*7+r*11+t*3)%2===0?1:-1;}
  function bordes(c,r,cols,filas){return{arriba:r===0?0:-signo(c,r-1,1),derecha:c===cols-1?0:signo(c,r,0),abajo:r===filas-1?0:signo(c,r,1),izquierda:c===0?0:-signo(c-1,r,0)};}
  function rutaPuzzle(w,h,b){
    const p=new Path2D();p.moveTo(0,0);
    function lado(x1,y1,x2,y2,s){const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=dy/L,ny=-dx/L,k=Math.min(w,h)*.19*s;
      const v=(t,d=0)=>[x1+dx*t+nx*d,y1+dy*t+ny*d];
      if(!s){p.lineTo(x2,y2);return;}p.lineTo(...v(.35));p.bezierCurveTo(...v(.35,k*.15),...v(.30,k),...v(.50,k));p.bezierCurveTo(...v(.70,k),...v(.65,k*.15),...v(.65));p.lineTo(x2,y2);
    }
    lado(0,0,w,0,b.arriba);lado(w,0,w,h,b.derecha);lado(w,h,0,h,b.abajo);lado(0,h,0,0,b.izquierda);p.closePath();return p;
  }
  function texturaTema(tipo){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    const colores=tipo==='suelo'?['#315c58','#2e5552','#244b4b','#476d5f']:tipo==='techo'?['#203542','#243d49','#233c47','#29424e']:['#e3dbc8','#d5cebb','#ded9cb','#c6d3c6'];
    const n=tipo==='suelo'?2:4,t=512/n;g.fillStyle=colores[0];g.fillRect(0,0,512,512);
    for(let r=0;r<n;r++)for(let col=0;col<n;col++){const p=rutaPuzzle(t,t,bordes(col,r,n,n));g.save();g.translate(col*t,r*t);g.fillStyle=colores[(col+r*3)%colores.length];g.fill(p);g.strokeStyle=tipo==='suelo'?'#a6a17d':tipo==='techo'?'#637a7b':'#a4aa98';g.lineWidth=tipo==='suelo'?2:1.6;g.stroke(p);g.restore();}
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;recursos.texturas.add(tex);return tex;
  }
  function mat(color,map=null){const m=new THREE.MeshBasicMaterial({color,map,toneMapped:false});recursos.materiales.add(m);return m;}
  const matPared=mat(0xffffff,texturaTema('pared')),matSuelo=mat(0xffffff,texturaTema('suelo')),matTecho=mat(0xffffff,texturaTema('techo'));
  const matMarco=mat(0x26454b),matDorado=mat(0xb7a16a),matLuz=mat(0xe3c988);
  const grupo=new THREE.Group();grupo.name='Comedor rompecabezas';grupo.visible=false;castillo.add(grupo);
  const cajaGeo=new THREE.BoxGeometry(1,1,1);recursos.geometrias.add(cajaGeo);
  function panel(nombre,x,y,z,w,h,d,material){
    const g=cajaGeo.clone(),uv=g.attributes.uv,caras=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let i=0;i<uv.count;i++){const[u,v]=caras[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*u/4,uv.getY(i)*v/4);}
    g.clearGroups();recursos.geometrias.add(g);const o=new THREE.Mesh(g,material);o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.userData.habitacion='Comedor';grupo.add(o);return o;
  }
  panel('Suelo puzzle comedor',13.45,3.025,8,12.2,.02,19.2,matSuelo);panel('Techo puzzle comedor',13.45,9.675,8,12.2,.02,19.2,matTecho);
  panel('Mural fondo comedor',19.55,6.35,8,.025,6.6,19.2,matPared);panel('Mural lateral comedor',13.45,6.35,-1.6,12.2,6.6,.025,matPared);panel('Mural lateral comedor',13.45,6.35,17.6,12.2,6.6,.025,matPared);
  panel('Mural entrada comedor sur',7.35,6.35,2.55,.025,6.6,8.3,matPared);panel('Mural entrada comedor norte',7.35,6.35,13.45,.025,6.6,8.3,matPared);panel('Dintel decorado comedor',7.35,8.15,8,.025,3,2.6,matPared);

  // 04. REVESTIR SOLO LA PARTE INTERIOR DE LAS COLUMNAS.
  function revestirColumnas(){
    const limite=new THREE.Box3(new THREE.Vector3(7.38,3.06,-1.58),new THREE.Vector3(19.53,9.64,17.58));castillo.updateMatrixWorld(true);
    const inversa=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),box=new THREE.Box3(),columnas=[];
    castillo.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.geometry?.type!=='CylinderGeometry')return;box.setFromObject(o).applyMatrix4(inversa);if(box.intersectsBox(limite))columnas.push(o);});
    const limites=[v=>v.x-limite.min.x,v=>limite.max.x-v.x,v=>v.y-limite.min.y,v=>limite.max.y-v.y,v=>v.z-limite.min.z,v=>limite.max.z-v.z];
    function recortar(poly,distancia){const salida=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distancia(a),db=distancia(b),ia=da>=-1e-6,ib=db>=-1e-6;if(ia)salida.push(a);if(ia!==ib)salida.push(a.clone().lerp(b,THREE.MathUtils.clamp(da/(da-db),0,1)));}return salida;}
    const vertices=[],uvs=[],centro=new THREE.Vector3();let total=0;
    function agregar(v){vertices.push(v.x,v.y,v.z);const dx=v.x-centro.x,dz=v.z-centro.z,angulo=(Math.atan2(dz,dx)+Math.PI*2)%(Math.PI*2);uvs.push(angulo*Math.hypot(dx,dz)/4,v.y/4);}
    for(const o of columnas){const pos=o.geometry.attributes.position,idx=o.geometry.index,m=new THREE.Matrix4().multiplyMatrices(inversa,o.matrixWorld),cantidad=idx?idx.count:pos.count,antes=vertices.length;centro.set(0,0,0).applyMatrix4(m);
      for(let i=0;i<cantidad;i+=3){let poly=[];for(let j=0;j<3;j++)poly.push(new THREE.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(m));for(const d of limites){poly=recortar(poly,d);if(poly.length<3)break;}for(let j=1;j<poly.length-1;j++){agregar(poly[0]);agregar(poly[j]);agregar(poly[j+1]);}}
      if(vertices.length>antes)total++;
    }
    if(vertices.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();g.computeBoundingSphere();const m=matPared.clone();m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;const o=new THREE.Mesh(g,m);o.name='Revestimiento puzzle columnas comedor';o.userData.habitacion='Comedor';o.renderOrder=1;grupo.add(o);recursos.geometrias.add(g);recursos.materiales.add(m);}
    return total;
  }
  const columnasRevestidas=revestirColumnas();
  const unidad=cajaGeo.toNonIndexed();
  function lote(nombre,items,material){const a=[],v=new THREE.Vector3(),m=new THREE.Matrix4();for(const[x,y,z,w,h,d]of items){m.makeScale(w,h,d);m.setPosition(x,y,z);for(let i=0;i<unidad.attributes.position.count;i++){v.fromBufferAttribute(unidad.attributes.position,i).applyMatrix4(m);a.push(v.x,v.y,v.z);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();g.computeBoundingSphere();recursos.geometrias.add(g);const o=new THREE.Mesh(g,material);o.name=nombre;o.userData.habitacion='Comedor';grupo.add(o);return o;}
  const remates=[],lineas=[];for(const y of[3.18,4.2,9.5])remates.push([19.49,y,8,.035,.07,19.1],[13.45,y,17.54,12.1,.07,.035],[13.45,y,-1.54,12.1,.07,.035]);
  remates.push([7.43,4.85,6.49,.08,3.6,.12],[7.43,4.85,9.51,.08,3.6,.12],[7.43,6.77,8,.08,.12,3.14]);for(const z of[1.5,8,14.5])remates.push([13.45,9.53,z,12.08,.12,.13]);
  lineas.push([19.46,9.4,8,.018,.035,19],[13.45,9.4,17.51,12,.035,.018],[13.45,9.4,-1.51,12,.035,.018]);lote('Marcos tematicos comedor',remates,matMarco);lote('Lineas decorativas comedor',lineas,matLuz);unidad.dispose();

  // 05. TRES ACCESOS3D. SUS TITULOS SE ACTUALIZAN DESDE EL CATALOGO.
  const forma=new THREE.Shape();forma.moveTo(-1.6,-1.6);forma.lineTo(-.5,-1.6);forma.bezierCurveTo(-.5,-2.2,.5,-2.2,.5,-1.6);forma.lineTo(1.6,-1.6);forma.lineTo(1.6,-.5);forma.bezierCurveTo(1,-.5,1,.5,1.6,.5);forma.lineTo(1.6,1.6);forma.lineTo(.5,1.6);forma.bezierCurveTo(.5,2.2,-.5,2.2,-.5,1.6);forma.lineTo(-1.6,1.6);forma.lineTo(-1.6,.5);forma.bezierCurveTo(-1,.5,-1,-.5,-1.6,-.5);forma.closePath();
  const geometriaPieza=new THREE.ExtrudeGeometry(forma,{depth:.24,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:1,curveSegments:16,steps:1});geometriaPieza.translate(0,0,-.12);recursos.geometrias.add(geometriaPieza);
  const objetivos=[],carteles=[];
  for(let i=0;i<3;i++){
    const z=[2,8,13.2][i],o=new THREE.Mesh(geometriaPieza,[mat(paleta[i]),matDorado]);o.name='Acceso rompecabezas '+(i+1);o.position.set(19.22,6.2,z);o.rotation.y=-Math.PI/2;o.userData.habitacion='Comedor';o.userData.interactivo=true;o.userData.rompecabezas=i;grupo.add(o);objetivos.push(o);
    const c=document.createElement('canvas');c.width=768;c.height=128;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;recursos.texturas.add(t);carteles.push({canvas:c,textura:t});
    const geo=new THREE.PlaneGeometry(i===2?3.6:4.8,.8);recursos.geometrias.add(geo);const etiqueta=new THREE.Mesh(geo,mat(0xffffff,t));etiqueta.position.set(19.04,3.7,z);etiqueta.rotation.y=-Math.PI/2;etiqueta.userData.habitacion='Comedor';grupo.add(etiqueta);
  }
  function actualizarCarteles(){
    carteles.forEach((item,i)=>{const idx=catalogo.length?i%catalogo.length:0;objetivos[i].userData.rompecabezas=idx;const g=item.canvas.getContext('2d');g.fillStyle='#183a40';g.fillRect(0,0,768,128);g.textAlign='center';g.fillStyle='#e8d6a0';g.font='bold 32px Arial';g.fillText(catalogo[idx]?.titulo||'TUS ROMPECABEZAS',384,55,720);g.fillStyle='#b8d9d0';g.font='25px Arial';g.fillText(catalogo.length?'Clic para jugar · 9 / 12 / 16 piezas':'Cargar imágenes del catálogo',384,101);item.textura.needsUpdate=true;});
  }
  const minis=new THREE.InstancedMesh(geometriaPieza,mat(0xffffff),6),dummy=new THREE.Object3D();let num=0;
  for(const z of[-1.45,17.45])for(const x of[9.3,13.4,17.5]){dummy.position.set(x,6.5,z);dummy.rotation.set(0,z<0?0:Math.PI,0);dummy.scale.setScalar(.25);dummy.updateMatrix();minis.setMatrixAt(num,dummy.matrix);minis.setColorAt(num,new THREE.Color(paleta[num%paleta.length]));num++;}
  minis.instanceMatrix.needsUpdate=true;if(minis.instanceColor)minis.instanceColor.needsUpdate=true;minis.computeBoundingBox();minis.computeBoundingSphere();minis.userData.habitacion='Comedor';grupo.add(minis);

  // 06. INTERFAZ Y BOTON PARA MOSTRAR/OCULTAR TODAS LAS GUIAS.
  const estilo=document.createElement('style');estilo.textContent=`
    #rp-abrir[hidden],#rp-modal[hidden]{display:none!important}
    #rp-abrir{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9;background:#164c4b;color:white;border:1px solid #a6c7a9;border-radius:22px;padding:12px 16px;font:600 13px system-ui;min-height:44px;touch-action:manipulation}
    #rp-modal{position:fixed;inset:0;z-index:75;background:#0b151bf5;color:#edf5ef;display:flex;align-items:center;justify-content:center;padding:12px;font:14px system-ui;overflow:auto}
    #rp-panel{position:relative;width:min(1280px,100%);max-height:96dvh;overflow:auto;background:#19333a;border:1px solid #9caa83;border-radius:16px;padding:14px;box-sizing:border-box}
    #rp-panel h2{font-size:19px;margin:0 0 6px}#rp-panel p{margin:6px 0;color:#cbdbcf;font-size:12px}.rp-fila{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}.rp-selectores{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}.rp-selectores label{display:flex;align-items:center;gap:7px;font-size:12px}
    #rp-panel button,#rp-panel select{background:#2b5550;color:#fff;border:1px solid #94ab8f;border-radius:8px;padding:10px 12px;min-height:44px;font:600 12px system-ui;touch-action:manipulation}#rp-panel button[aria-pressed=true]{background:#877445}#rp-panel button:disabled,#rp-panel select:disabled{opacity:.45}
    #rp-canvas{display:block;width:100%;max-width:1150px;height:auto;margin:8px auto;touch-action:none;border-radius:10px;background:#1c303a;user-select:none;-webkit-user-select:none}
    #rp-progreso{font-weight:600;color:#ead795;font-size:12px}#rp-estado{min-height:1.4em;overflow-wrap:anywhere}#rp-panel button:focus-visible,#rp-panel select:focus-visible{outline:2px solid #99f0d4;outline-offset:2px}
  `;document.head.appendChild(estilo);
  const jugar=document.createElement('button');jugar.type='button';jugar.id='rp-abrir';jugar.textContent='Jugar rompecabezas · G';jugar.hidden=true;document.body.appendChild(jugar);
  const modal=document.createElement('div');modal.id='rp-modal';modal.hidden=true;
  modal.innerHTML=`<section id="rp-panel" role="dialog" aria-modal="true" aria-labelledby="rp-titulo"><div class="rp-fila"><h2 id="rp-titulo">Tus rompecabezas</h2><span id="rp-progreso"></span></div><div class="rp-selectores"><label>Imagen <select id="rp-imagen"></select></label><label>Nivel <select id="rp-nivel"></select></label></div><p>Arrastra una pieza a su lugar o toca la pieza y después su casilla. Sin guías, el tablero no muestra imagen ni cuadrícula.</p><canvas id="rp-canvas" width="1000" height="1200" aria-label="Tablero del rompecabezas"></canvas><p id="rp-estado" role="status"></p><div class="rp-fila"><button type="button" id="rp-reiniciar">Reiniciar</button><button type="button" id="rp-referencia" aria-pressed="false">Mostrar guías</button><button type="button" id="rp-recargar">Recargar catálogo</button><button type="button" id="rp-volver">Volver al castillo</button></div></section>`;document.body.appendChild(modal);
  const $=id=>modal.querySelector('#'+id),canvas=$('rp-canvas'),ctx=canvas.getContext('2d');
  for(const[i,item]of niveles.entries()){const o=document.createElement('option');o.value=i;o.textContent=item.titulo;$('rp-nivel').appendChild(o);}
  function mensaje(t){$('rp-estado').textContent=t;}
  function actualizarSelectores(){
    const lista=$('rp-imagen');lista.replaceChildren();
    if(!catalogo.length){const o=document.createElement('option');o.textContent=cargandoCatalogo?'Cargando catálogo…':'Sin imágenes disponibles';lista.appendChild(o);}
    catalogo.forEach((item,i)=>{const o=document.createElement('option');o.value=i;o.textContent=item.titulo;lista.appendChild(o);});lista.value=String(retoActual);
    lista.disabled=cargandoCatalogo||!catalogo.length;$('rp-nivel').disabled=cargandoCatalogo||!catalogo.length;
    $('rp-reiniciar').disabled=cargandoCatalogo||!catalogo.length;$('rp-referencia').disabled=!iniciado||cargandoImagen;
    $('rp-referencia').textContent=referencia?'Ocultar guías':'Mostrar guías';$('rp-referencia').setAttribute('aria-pressed',String(referencia));
  }

  // 07. CATALOGO REAL. NO SE ADIVINAN NOMBRES NI SE LISTAN CARPETAS.
  function normalizarCatalogo(datos){
    const entrada=Array.isArray(datos)?datos:datos?.imagenes;
    if(!Array.isArray(entrada))throw new Error('El catálogo debe ser una lista o un objeto con imagenes:[...].');
    const resultado=[],vistos=new Set();
    for(const[itemIndex,item]of entrada.entries()){
      const objeto=typeof item==='string'?{archivo:item}:item;
      if(!objeto||typeof objeto!=='object')continue;
      const archivo=objeto.archivo;
      let src;
      if(typeof archivo==='string'&&archivo.trim()){
        // Codificar espacios, tildes, # y ? de los nombres reales de archivo.
        const ruta=archivo.split('/').map(encodeURIComponent).join('/');src=new URL(ruta,baseCarpeta).href;
      }else if(typeof objeto.src==='string'&&objeto.src.trim())src=new URL(objeto.src,baseCarpeta).href;
      else continue;
      if(vistos.has(src))continue;vistos.add(src);
      const nombre=archivo||objeto.src||'Imagen '+(itemIndex+1);
      const titulo=objeto.titulo||nombre.split('/').pop().replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
      resultado.push({id:String(objeto.id??src),titulo:String(titulo),src,descripcion:String(objeto.descripcion??objeto.mensajeFinal??'')});
    }
    return resultado;
  }
  async function cargarCatalogo(){
    const version=++versionCatalogo;cargandoCatalogo=true;actualizarSelectores();
    try{
      let datos;
      if(Array.isArray(opciones.imagenes))datos=opciones.imagenes;
      else{
        const respuesta=await fetch(urlCatalogo.href,{cache:'no-store',signal:abortarCatalogo.signal});
        if(!respuesta.ok)throw new Error('Catálogo no disponible (HTTP '+respuesta.status+'): '+urlCatalogo.href);
        datos=await respuesta.json();
      }
      const nuevo=normalizarCatalogo(datos);
      if(!nuevo.length)throw new Error('El catálogo no contiene imágenes. Añade archivos y genera imagenes.json.');
      if(destruido||version!==versionCatalogo)return false;
      catalogo=nuevo;retoActual=Math.min(retoActual,catalogo.length-1);actualizarCarteles();
      mensaje(catalogo.length+' imágenes listas. Elige una para jugar.');return true;
    }catch(error){
      if(!destruido&&version===versionCatalogo&&error.name!=='AbortError')mensaje(error.message+' Genera el catálogo o revisa carpetaImagenes.');
      return false;
    }finally{if(!destruido&&version===versionCatalogo){cargandoCatalogo=false;actualizarSelectores();}}
  }

  // 08. CARGA ASINCRONA DE LA IMAGEN SELECCIONADA Y CACHE PEQUEÑA.
  function leerImagen(src){
    let cancelar;const promesa=new Promise((resolve,reject)=>{
      const img=new Image();let finalizado=false;
      const terminar=(error)=>{if(finalizado)return;finalizado=true;clearTimeout(timeout);img.onload=img.onerror=null;if(error)reject(error);else resolve(img);};
      const timeout=setTimeout(()=>{terminar(new Error('La imagen tardó demasiado en cargar: '+src));img.src='';},20000);
      cancelar=()=>{terminar(new Error('Carga cancelada'));img.src='';};
      img.crossOrigin='anonymous';img.decoding='async';
      img.onload=()=>{if(!img.naturalWidth||!img.naturalHeight)terminar(new Error('Imagen vacía o inválida: '+src));else terminar();};
      img.onerror=()=>terminar(new Error('No se pudo cargar la imagen: '+src));img.src=src;
    });return{promesa,cancelar:()=>cancelar?.()};
  }
  function cancelarCarga(){if(solicitudImagen){solicitudImagen.cancelar();solicitudImagen=null;}}
  function dimensionesTablero(ancho,alto){const ratio=ancho/alto;const w=Math.min(650,390*ratio);return{w,h:w/ratio};}
  async function obtenerImagen(item){
    if(cacheImagenes.has(item.src)){const valor=cacheImagenes.get(item.src);cacheImagenes.delete(item.src);cacheImagenes.set(item.src,valor);return valor;}
    const solicitud=leerImagen(item.src);solicitudImagen=solicitud;
    try{
      const img=await solicitud.promesa;const d=dimensionesTablero(img.naturalWidth,img.naturalHeight);
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(d.w*2));c.height=Math.max(1,Math.round(d.h*2));
      const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(img,0,0,c.width,c.height);
      const preparado={canvas:c,w:d.w,h:d.h};cacheImagenes.set(item.src,preparado);
      while(cacheImagenes.size>2)cacheImagenes.delete(cacheImagenes.keys().next().value);
      return preparado;
    }finally{if(solicitudImagen===solicitud)solicitudImagen=null;}
  }

  // 09. INICIAR PARTIDA CON LA FOTO REAL, SIN DEFORMARLA.
  function mezclar(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  async function reiniciar(){
    ocultarMensajeFinal();
    if(!catalogo.length||destruido)return;
    const version=++versionPartida;cancelarCarga();
    cargandoImagen=true;iniciado=false;arrastre=seleccionada=null;piezas=[];imagen=null;resueltas=movimientos=0;tiempoAcumulado=0;terminado=false;
    const item=catalogo[retoActual];mensaje('Cargando '+item.titulo+'…');actualizarSelectores();dibujar();
    try{
      const preparada=await obtenerImagen(item);
      if(destruido||version!==versionPartida)return;
      imagen=preparada.canvas;W=preparada.w;H=preparada.h;BX=(CW-W)/2;BY=55;
      COLS=niveles[nivelActual].cols;FILAS=niveles[nivelActual].filas;PW=W/COLS;PH=H/FILAS;
      const orden=mezclar(Array.from({length:COLS*FILAS},(_,i)=>i));
      piezas=orden.map((id,slot)=>{
        const c=id%COLS,r=Math.floor(id/COLS),pasoX=880/COLS,pasoY=560/FILAS;
        const x=60+(slot%COLS)*pasoX+(pasoX-PW)/2,y=590+Math.floor(slot/COLS)*pasoY;
        return{id,c,r,x,y,casaX:x,casaY:y,puesta:false,ruta:rutaPuzzle(PW,PH,bordes(c,r,COLS,FILAS))};
      });
      iniciado=true;inicioTiempo=performance.now();mensaje(item.titulo+': coloca las piezas en su lugar.');
    }catch(error){if(!destruido&&version===versionPartida)mensaje(error.message+' Revisa el nombre y usa un servidor local.');}
    finally{if(!destruido&&version===versionPartida){cargandoImagen=false;actualizarSelectores();actualizarMarcador();dibujar();}}
  }
  function segundos(){return tiempoAcumulado+((abierto&&iniciado&&!terminado&&!cargandoImagen)?(performance.now()-inicioTiempo)/1000:0);}
  function actualizarMarcador(){const t=Math.floor(segundos());$('rp-progreso').textContent=`${resueltas} / ${niveles[nivelActual].cols*niveles[nivelActual].filas} piezas · ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · ${movimientos} intentos`;}
  function dibujarPieza(p){
    ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor='#0009';ctx.shadowBlur=p===seleccionada?13:5;ctx.shadowOffsetY=3;ctx.fillStyle='#cfb481';ctx.fill(p.ruta);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.save();ctx.clip(p.ruta);ctx.drawImage(imagen,-p.c*PW,-p.r*PH,W,H);ctx.restore();ctx.lineWidth=p===seleccionada?4:1.7;ctx.strokeStyle=p.puesta?'#b1ead0':p===seleccionada?'#ffe19b':'#283c43';ctx.stroke(p.ruta);ctx.restore();
  }

  // 10. GUIAS: APAGADAS = NEGRO PURO, SIN FOTO NI CUADRICULA.
  function dibujar(){
    ctx.clearRect(0,0,CW,CH);ctx.fillStyle='#1b303a';ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle='#0e2028';ctx.fillRect(BX-10,BY-10,W+20,H+20);
    ctx.fillStyle='#000000';ctx.fillRect(BX,BY,W,H);
    if(!iniciado||!imagen){ctx.fillStyle='#c7d9d3';ctx.font='24px Arial';ctx.textAlign='center';ctx.fillText(cargandoImagen?'Cargando imagen…':'Elige una imagen del catálogo',500,260);return;}
    if(referencia){
      ctx.save();ctx.globalAlpha=.65;ctx.drawImage(imagen,BX,BY,W,H);ctx.restore();
      ctx.strokeStyle='#c5dfce90';ctx.lineWidth=2;
      for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(BX+c*PW,BY);ctx.lineTo(BX+c*PW,BY+H);ctx.stroke();}
      for(let r=0;r<=FILAS;r++){ctx.beginPath();ctx.moveTo(BX,BY+r*PH);ctx.lineTo(BX+W,BY+r*PH);ctx.stroke();}
    }
    ctx.fillStyle='#bfd3ce';ctx.font='23px Arial';ctx.textAlign='center';ctx.fillText('PIEZAS',500,535);
    for(const p of piezas)if(p.puesta)dibujarPieza(p);
    for(const p of piezas)if(!p.puesta&&p!==seleccionada)dibujarPieza(p);
    if(seleccionada&&!seleccionada.puesta)dibujarPieza(seleccionada);
  }

  // 11. ARRASTRAR CON RATON O TOCAR PIEZA Y CASILLA.
  function puntoCanvas(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*CW/r.width,y:(e.clientY-r.top)*CH/r.height};}
  function piezaEn(p){const orden=seleccionada?[...piezas.filter(o=>o!==seleccionada),seleccionada]:piezas;for(let i=orden.length-1;i>=0;i--){const o=orden[i];if(!o.puesta&&ctx.isPointInPath(o.ruta,p.x-o.x,p.y-o.y))return o;}return null;}
  function colocar(p,correcto){
    movimientos++;if(correcto){p.x=BX+p.c*PW;p.y=BY+p.r*PH;p.puesta=true;resueltas++;seleccionada=null;mensaje('¡Pieza correcta!');}else{p.x=p.casaX;p.y=p.casaY;mensaje('Esa no es su posición. Inténtalo otra vez.');}
    if(resueltas===COLS*FILAS&&!terminado){tiempoAcumulado=segundos();terminado=true;mostrarMensajeFinal();}actualizarMarcador();dibujar();
  }
  function tocarCasilla(p){if(!seleccionada||p.x<BX||p.x>=BX+W||p.y<BY||p.y>=BY+H)return;const c=Math.floor((p.x-BX)/PW),r=Math.floor((p.y-BY)/PH);colocar(seleccionada,c===seleccionada.c&&r===seleccionada.r);}
  canvas.addEventListener('pointerdown',e=>{
    ultimoPunteroRompecabezas={clientX:e.clientX,clientY:e.clientY};
    if(!abierto||!iniciado||cargandoImagen||arrastre||terminado)return;e.preventDefault();const p=puntoCanvas(e),pieza=piezaEn(p);if(!pieza){tocarCasilla(p);return;}
    seleccionada=pieza;arrastre={id:e.pointerId,pieza,dx:p.x-pieza.x,dy:p.y-pieza.y,inicioX:p.x,inicioY:p.y,movido:false};try{canvas.setPointerCapture(e.pointerId);}catch{}dibujar();
  });
  canvas.addEventListener('pointermove',e=>{
    if(arrastre&&e.pointerId===arrastre.id)ultimoPunteroRompecabezas={clientX:e.clientX,clientY:e.clientY};if(!arrastre||e.pointerId!==arrastre.id)return;e.preventDefault();const p=puntoCanvas(e);if(Math.hypot(p.x-arrastre.inicioX,p.y-arrastre.inicioY)>8)arrastre.movido=true;if(arrastre.movido){arrastre.pieza.x=THREE.MathUtils.clamp(p.x-arrastre.dx,0,CW-PW);arrastre.pieza.y=THREE.MathUtils.clamp(p.y-arrastre.dy,0,CH-PH);dibujar();}});
  function terminarArrastre(e,cancelado=false){if(!arrastre||e.pointerId!==arrastre.id)return;const a=arrastre;arrastre=null;if(cancelado){a.pieza.x=a.pieza.casaX;a.pieza.y=a.pieza.casaY;dibujar();return;}if(a.movido){const tx=BX+a.pieza.c*PW,ty=BY+a.pieza.r*PH;colocar(a.pieza,Math.hypot(a.pieza.x-tx,a.pieza.y-ty)<Math.min(PW,PH)*.42);}else{mensaje('Pieza seleccionada: toca su casilla o arrástrala.');dibujar();}}
  canvas.addEventListener('pointerup',e=>terminarArrastre(e));canvas.addEventListener('pointercancel',e=>terminarArrastre(e,true));canvas.addEventListener('lostpointercapture',e=>terminarArrastre(e,true));canvas.addEventListener('contextmenu',e=>e.preventDefault());

  // 12. ABRIR EL JUEGO DESDE LAS PIEZAS3D O EL BOTON MOVIL.
  const raycaster=new THREE.Raycaster(),centro=new THREE.Vector2(0,0),clic=new THREE.Vector2(),puntoMundo=new THREE.Vector3();
  function jugadorLocal(){castillo.updateWorldMatrix(true,false);inv.copy(castillo.matrixWorld).invert();return camara.getWorldPosition(local).applyMatrix4(inv);}
  function objetivoCercano(){if(destruido||abierto||!dentro(jugadorLocal()))return null;let elegido=null,dMax=5.5;for(const o of objetivos){o.getWorldPosition(puntoMundo);const d=camara.position.distanceTo(puntoMundo);if(d<dMax){elegido=o;dMax=d;}}return elegido;}
  function ocultarMenu(){if(abierto){const m=document.getElementById('menu');if(m)m.hidden=true;}}
  async function abrirJuego(objetivo=null){
    const candidato=objetivo||objetivoCercano();if(!candidato||destruido||abierto||!dentro(jugadorLocal()))return;candidato.getWorldPosition(puntoMundo);if(camara.position.distanceTo(puntoMundo)>5.5)return;
    abierto=true;modal.hidden=false;aplicarZoomRompecabezas?.();jugar.hidden=true;controles?.pausar?.();if(document.pointerLockElement)document.exitPointerLock();ocultarMenu();$('rp-volver').focus();
    if(cargandoCatalogo)await promesaCatalogo;
    if(!abierto||destruido)return;
    if(!catalogo.length){dibujar();actualizarSelectores();return;}
    const nuevo=candidato.userData.rompecabezas%catalogo.length;
    if(!iniciado||nuevo!==retoActual){retoActual=nuevo;actualizarSelectores();await reiniciar();}else{inicioTiempo=performance.now();dibujar();actualizarMarcador();}
  }
  function cerrarJuego(reanudar=true){if(!abierto)return;if(iniciado&&!terminado&&!cargandoImagen)tiempoAcumulado=segundos();abierto=false;modal.hidden=true;if(arrastre){arrastre.pieza.x=arrastre.pieza.casaX;arrastre.pieza.y=arrastre.pieza.casaY;arrastre=null;}seleccionada=null;if(reanudar)document.getElementById('boton-iniciar')?.click();}
  function clickEscena(e){
    if(e.target!==elemento||!document.getElementById('menu')?.hidden||!objetivoCercano())return;
    if(document.pointerLockElement===elemento)raycaster.setFromCamera(centro,camara);else{const r=elemento.getBoundingClientRect();clic.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(clic,camara);}
    grupo.updateWorldMatrix(true,true);const hits=raycaster.intersectObjects(objetivos,false);if(hits.length)abrirJuego(hits[0].object);
  }
  function tecla(e){if(e.repeat)return;if(abierto&&e.code==='Escape'){e.preventDefault();cerrarJuego(true);return;}if(e.code==='KeyG'&&document.getElementById('menu')?.hidden&&objetivoCercano()){e.preventDefault();abrirJuego();}}
  function pointerLock(){if(abierto)queueMicrotask(ocultarMenu);}
  jugar.addEventListener('click',()=>abrirJuego());$('rp-volver').addEventListener('click',()=>cerrarJuego(true));$('rp-reiniciar').addEventListener('click',()=>reiniciar());
  $('rp-referencia').addEventListener('click',()=>{referencia=!referencia;actualizarSelectores();dibujar();});
  $('rp-imagen').addEventListener('change',e=>{retoActual=Number(e.target.value);reiniciar();});$('rp-nivel').addEventListener('change',e=>{nivelActual=Number(e.target.value);reiniciar();});
  $('rp-recargar').addEventListener('click',async()=>{if(cargandoCatalogo)return;versionPartida++;cancelarCarga();cacheImagenes.clear();cargandoImagen=false;iniciado=false;piezas=[];imagen=null;dibujar();promesaCatalogo=cargarCatalogo();if(await promesaCatalogo)reiniciar();});
  elemento.addEventListener('click',clickEscena);document.addEventListener('keydown',tecla);document.addEventListener('pointerlockchange',pointerLock);

  // 13. ACTUALIZACION Y API COMPATIBLE.
  function actualizar(dt){
    if(destruido)return;actualizarDesplazamientoArrastre(dt);const estaDentro=dentro(jugadorLocal()),abierta=Boolean(puerta.abierta&&Math.abs(puerta.angulo??puerta.pivote.rotation.y)>.015),visible=oclusion?.estadisticas?.habitacionesVisibles?.includes('Comedor')??true;
    grupo.visible=(estaDentro||abierta)&&(estaDentro||visible);if(estaDentro)for(const o of grupo.children)o.visible=true;
    const cercano=objetivoCercano();jugar.hidden=abierto||!cercano||!document.getElementById('menu')?.hidden;
    if(cercano){const nombre=catalogo[cercano.userData.rompecabezas]?.titulo;const texto=nombre?'Jugar: '+nombre+' · G':'Abrir rompecabezas · G';if(jugar.textContent!==texto)jugar.textContent=texto;}
    if(abierto){ocultarMenu();relojUI+=dt;if(relojUI>=.5){relojUI=0;actualizarMarcador();}}
  }
  
  // RP_MEJORAS_PERSONALIZADAS_V2
  // RP_ZOOM_JUGADOR_V3
  let aplicarZoomRompecabezas = null;
  let limpiarZoomRompecabezas = null;
  let ultimoPunteroRompecabezas = null;
  function ocultarMensajeFinal() {
    const aviso = $('rp-final');
    if (aviso) { aviso.hidden = true; aviso.textContent = ''; }
  }
  function mostrarMensajeFinal() {
    let aviso = $('rp-final');
    if (!aviso) {
      aviso = document.createElement('div'); aviso.id = 'rp-final';
      aviso.setAttribute('role','status'); aviso.setAttribute('aria-live','polite');
      $('rp-estado').insertAdjacentElement('afterend',aviso);
    }
    const item = catalogo[retoActual];
    aviso.textContent = item?.descripcion?.trim() || '¡Completaste el rompecabezas!';
    aviso.hidden = false;
    mensaje('¡Rompecabezas completado!');
    aviso.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function inicializarMejorasRompecabezas() {
    estilo.textContent += '\n' +
      '#rp-final{padding:16px;margin:12px 0;border:1px solid #d9bf70;border-radius:10px;background:#31483d;color:#fff1ba;white-space:pre-wrap;line-height:1.6;font:16px system-ui}' +
      '#rp-final[hidden]{display:none!important}' +
      '#rp-navegacion{position:sticky;top:0;z-index:3;display:flex;gap:8px;justify-content:center;padding:8px;background:#19333af5;border-radius:8px;margin-bottom:8px}' +
      '#rp-canvas{scroll-margin-top:80px}';
    const barra = document.createElement('div'); barra.id = 'rp-navegacion';
    const tablero = document.createElement('button'); tablero.type = 'button'; tablero.textContent = 'Ver tablero';
    const piezas = document.createElement('button'); piezas.type = 'button'; piezas.textContent = 'Ver piezas';
    barra.append(tablero,piezas); canvas.insertAdjacentElement('beforebegin',barra);

    // Zoom visual. No modifica las coordenadas internas ni la partida.
    let zoomActual = 1;
    function limitarZoom(valor) {
      return Math.max(0.6, Math.min(1.6, Math.round(valor * 10) / 10));
    }
    const menos = document.createElement('button'); menos.type = 'button'; menos.textContent = '−';
    menos.setAttribute('aria-label','Reducir tamaño del rompecabezas'); menos.title = 'Reducir';
    const mas = document.createElement('button'); mas.type = 'button'; mas.textContent = '+';
    mas.setAttribute('aria-label','Aumentar tamaño del rompecabezas'); mas.title = 'Ampliar';
    const porcentaje = document.createElement('span'); porcentaje.id = 'rp-zoom-valor';
    porcentaje.setAttribute('role','status'); porcentaje.setAttribute('aria-live','polite');
    barra.append(menos,porcentaje,mas);
    estilo.textContent += '\n' +
      '#rp-navegacion{flex-wrap:wrap;left:0;max-width:100%;box-sizing:border-box}' +
      '#rp-zoom-valor{min-width:50px;text-align:center;font:600 13px system-ui;align-self:center}' +
      '#rp-navegacion button[title="Reducir"],#rp-navegacion button[title="Ampliar"]{min-width:44px;font-size:20px;padding:5px 12px}';
    function aplicarZoom(mantenerCentro = false) {
      const panel = $('rp-panel');
      const anchoAntes = canvas.clientWidth, altoAntes = canvas.clientHeight;
      const centroX = anchoAntes > 0 ? (panel.scrollLeft + panel.clientWidth/2 - canvas.offsetLeft)/anchoAntes : 0.5;
      const centroY = altoAntes > 0 ? (panel.scrollTop + panel.clientHeight/2 - canvas.offsetTop)/altoAntes : 0;
      const css = getComputedStyle(panel);
      const padding = (parseFloat(css.paddingLeft)||0) + (parseFloat(css.paddingRight)||0);
      const disponible = panel.clientWidth > 0 ? panel.clientWidth-padding : window.innerWidth-56;
      const anchoBase = Math.min(840,Math.max(200,disponible));
      canvas.style.width = Math.round(anchoBase*zoomActual)+'px';
      canvas.style.maxWidth = 'none'; canvas.style.height = 'auto';
      porcentaje.textContent = Math.round(zoomActual*100)+'%';
      menos.disabled = zoomActual <= 0.6; mas.disabled = zoomActual >= 1.6;
      if(mantenerCentro && anchoAntes>0 && altoAntes>0 && panel.clientWidth>0) {
        panel.scrollLeft = Math.max(0,canvas.offsetLeft+centroX*canvas.clientWidth-panel.clientWidth/2);
        panel.scrollTop = Math.max(0,canvas.offsetTop+centroY*canvas.clientHeight-panel.clientHeight/2);
      }
    }
    menos.addEventListener('click',()=>{zoomActual=limitarZoom(zoomActual-0.1);aplicarZoom(true);});
    mas.addEventListener('click',()=>{zoomActual=limitarZoom(zoomActual+0.1);aplicarZoom(true);});
    aplicarZoomRompecabezas = ()=>aplicarZoom(false);
    const redimensionar = ()=>aplicarZoom(false);
    window.addEventListener('resize',redimensionar);
    limpiarZoomRompecabezas = ()=>window.removeEventListener('resize',redimensionar);
    aplicarZoom(false);

    tablero.addEventListener('click', () => {
      $('rp-panel').scrollTo({top:Math.max(0,canvas.offsetTop-90),behavior:'smooth'});
    });
    piezas.addEventListener('click', () => {
      $('rp-panel').scrollTo({top:Math.max(0,canvas.offsetTop+canvas.clientHeight*(535/CH)-75),behavior:'smooth'});
    });
  }
  function actualizarDesplazamientoArrastre(dt) {
    if (!abierto || !arrastre?.movido || !ultimoPunteroRompecabezas) return;
    const panel = $('rp-panel'), r = panel.getBoundingClientRect();
    const y = ultimoPunteroRompecabezas.clientY, borde = 75;
    let velocidad = 0;
    if (y < r.top+borde) velocidad = -Math.min(1,(r.top+borde-y)/borde)*650;
    else if (y > r.bottom-borde) velocidad = Math.min(1,(y-(r.bottom-borde))/borde)*650;
    const antes = panel.scrollTop;
    panel.scrollTop += velocidad*Math.min(0.05,Math.max(0,dt));
    if (panel.scrollTop !== antes) {
      const p = puntoCanvas(ultimoPunteroRompecabezas);
      arrastre.pieza.x = THREE.MathUtils.clamp(p.x-arrastre.dx,0,CW-PW);
      arrastre.pieza.y = THREE.MathUtils.clamp(p.y-arrastre.dy,0,CH-PH);
      dibujar();
    }
  }


  inicializarMejorasRompecabezas();
  actualizarCarteles();actualizarSelectores();actualizarMarcador();dibujar();promesaCatalogo=cargarCatalogo();
  return{
    actualizar,vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},abrirJuego,cerrarJuego,
    get progreso(){return{rompecabezas:catalogo[retoActual]?.titulo||null,colocadas:resueltas,total:niveles[nivelActual].cols*niveles[nivelActual].filas,movimientos,completado:terminado,cargando:cargandoImagen};},
    informe:{mueblesYLuminariasRetirados:retirar.size,colisionesRetiradas,columnasRevestidas,piezasInteractivas:3,niveles:[9,12,16],get rompecabezas(){return catalogo.length;},carpetaImagenes:baseCarpeta.href,catalogo:urlCatalogo.href,lucesNuevas:0},
    liberar(){if(destruido)return;if(abierto)cerrarJuego(false);limpiarZoomRompecabezas?.();destruido=true;versionPartida++;versionCatalogo++;abortarCatalogo.abort();cancelarCarga();cacheImagenes.clear();elemento.removeEventListener('click',clickEscena);document.removeEventListener('keydown',tecla);document.removeEventListener('pointerlockchange',pointerLock);jugar.remove();modal.remove();estilo.remove();grupo.removeFromParent();minis.dispose();for(const g of recursos.geometrias)g.dispose();for(const m of recursos.materiales)m.dispose();for(const t of recursos.texturas)t.dispose();}
  };
}

exports.crearComedorRompecabezas = crearComedorRompecabezas;
},
"./piso.js": function(module, exports, __require) {
const THREE = __THREE;
const { CONFIG } = __require("./config.js");



function crearPiso(escena) {
  const grupo = new THREE.Group();
  grupo.name = 'terreno';

  const geometriaTerreno = new THREE.PlaneGeometry(
    CONFIG.terreno.ancho,
    CONFIG.terreno.largo
  );

  const materialTerreno = new THREE.MeshStandardMaterial({
    color: CONFIG.terreno.color,
    roughness: 1,
    metalness: 0
  });

  const terreno = new THREE.Mesh(
    geometriaTerreno,
    materialTerreno
  );

  terreno.name = 'suelo';
  terreno.rotation.x = -Math.PI / 2;

  grupo.add(terreno);

  const geometriaCamino = new THREE.PlaneGeometry(
    CONFIG.camino.ancho,
    CONFIG.camino.largo
  );

  const materialCamino = new THREE.MeshStandardMaterial({
    color: CONFIG.camino.color,
    roughness: 1,
    metalness: 0
  });

  const camino = new THREE.Mesh(
    geometriaCamino,
    materialCamino
  );

  camino.name = 'camino';
  camino.rotation.x = -Math.PI / 2;

  // Lo separamos ligeramente del suelo para evitar parpadeos.
  camino.position.set(
    0,
    0.015,
    CONFIG.camino.centroZ
  );

  grupo.add(camino);
  escena.add(grupo);

  return grupo;
}
exports.crearPiso = crearPiso;
},
"./despejarEscaleraYSalida.js": function(module, exports, __require) {
const THREE = __THREE;


// Antes de cachear colisiones y fusionar estructura.
function despejarEscaleraYSalida(castillo) {
  if(castillo.getObjectByName('Estructura agrupada por sectores'))throw new Error('Ejecuta despejarEscaleraYSalida antes de agruparEstructura.');
  const nombres=new Set(['Cerramiento caja escalera','Paño entre descansos','Cubierta caja escalera']);
  const quitar=new Set(),protegidos=new Set();
  for(const p of castillo.userData.puertas||[])p.marco.traverse(o=>protegidos.add(o));
  castillo.updateMatrixWorld(true);
  const inversa=new THREE.Matrix4().copy(castillo.matrixWorld).invert();
  const box=new THREE.Box3();
  // Solo el paso inmediato frente a la puerta del salon, antes del pabellon.
  const paso=new THREE.Box3(new THREE.Vector3(-1.15,17.7,-0.85),new THREE.Vector3(1.15,20.9,4.7));
  const informe={cerramientoRetirado:[],bloqueosSalidaRetirados:[]};
  castillo.traverse(o=>{
    if(!o.isMesh)return;
    if(nombres.has(o.name)){quitar.add(o);informe.cerramientoRetirado.push(o.name);return;}
    if(protegidos.has(o)||o.isInstancedMesh)return;
    if(/Tejado|Cornisa|Cubierta|Losa|pelda|Caracol|Nucleo|Marco|Columna|Candelabro|Pasamanos|Balaustre/i.test(o.name))return;
    box.setFromObject(o).applyMatrix4(inversa);
    const ancho=box.max.x-box.min.x,alto=box.max.y-box.min.y,fondo=box.max.z-box.min.z;
    // No elimina muros laterales ni toda la casa: solo una pared transversal
    // delgada o barrera que efectivamente invada el paso central.
    if(box.intersectsBox(paso)&&ancho>=2&&alto>=0.6&&fondo<=0.8&&
      /Muro|Pared|Paño|Cierre|Baranda|Colision/i.test(o.name)){
      quitar.add(o);informe.bloqueosSalidaRetirados.push(o.name);
    }
  });
  // Si una barrera retirada tenia pasamanos/listones en el mismo plano,
  // elimina solo los que tambien cruzan el ancho libre del paso.
  const extras=[];
  castillo.traverse(o=>{
    if(!o.isMesh||protegidos.has(o)||!/Pasamanos|Balaustre/.test(o.name))return;
    box.setFromObject(o).applyMatrix4(inversa);
    if(box.intersectsBox(paso)&&box.max.z-box.min.z<=0.8)extras.push(o);
  });
  for(const o of extras)quitar.add(o);
  const obstaculos=castillo.userData.colisiones;
  for(let i=obstaculos.length-1;i>=0;i--)if(quitar.has(obstaculos[i].mesh))obstaculos.splice(i,1);
  for(const o of quitar)o.removeFromParent();
  informe.totalRetirados=quitar.size;
  informe.nota='Conserva escalones, nucleo y puertas. El despeje exterior solo cubre el paso entre salon y pabellon.';
  return informe;
}

exports.despejarEscaleraYSalida = despejarEscaleraYSalida;
},
"./monitorRendimiento.js": function(module, exports, __require) {

function crearMonitorRendimiento(escena,camara,renderizador,entorno) {
  const sol=escena.getObjectByName('Sol principal');
  const ajustes={perfil:'medio',mostrarPanel:true};
  const metricas={fps:0,msCuadro:0,msCPU:0,llamadasDibujo:0,triangulos:0,texturas:0,geometrias:0};
  const panel=document.createElement('div');panel.style.cssText='position:fixed;top:12px;left:12px;color:#d9ffb0;background:#07110bc9;border-radius:5px;padding:7px 9px;font:12px monospace;pointer-events:none;z-index:9';document.body.appendChild(panel);
  let cuadros=0,tiempo=0,cpu=0,relojSombras=1;
  renderizador.shadowMap.autoUpdate=false;
  function perfil(nombre='medio') {
    const p={bajo:{ratio:0.75,sombras:false,mapa:1024,bosque:65},medio:{ratio:1,sombras:true,mapa:1024,bosque:85},alto:{ratio:1.25,sombras:true,mapa:2048,bosque:105}}[nombre];
    if(!p)throw new Error('Perfil valido: bajo, medio o alto');
    ajustes.perfil=nombre;
    const limite=Math.sqrt(2000000/(window.innerWidth*window.innerHeight));
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio,p.ratio,limite));renderizador.setSize(window.innerWidth,window.innerHeight);
    renderizador.shadowMap.enabled=p.sombras;entorno.ajustes.distanciaVegetacion=p.bosque;
    if(sol){sol.shadow.mapSize.set(p.mapa,p.mapa);if(sol.shadow.map){sol.shadow.map.dispose();sol.shadow.map=null;}sol.shadow.needsUpdate=true;}
    renderizador.shadowMap.needsUpdate=true;
  }
  perfil();
  function antes(dt) {
    relojSombras+=dt;
    renderizador.shadowMap.needsUpdate=relojSombras>=0.1;
    if(relojSombras>=0.1){relojSombras=0;if(sol)sol.shadow.needsUpdate=true;}
  }
  function despues(segundos,cpuMs) {
    if(document.hidden)return;
    tiempo+=segundos;cuadros++;cpu+=cpuMs;
    if(tiempo<0.8)return;
    metricas.fps=Math.round(cuadros/tiempo);metricas.msCuadro=+(tiempo*1000/cuadros).toFixed(1);metricas.msCPU=+(cpu/cuadros).toFixed(1);
    metricas.llamadasDibujo=renderizador.info.render.calls;metricas.triangulos=renderizador.info.render.triangles;
    metricas.texturas=renderizador.info.memory.textures;metricas.geometrias=renderizador.info.memory.geometries;
    panel.hidden=!ajustes.mostrarPanel;
    panel.textContent=`${metricas.fps} FPS | ${metricas.msCuadro} ms | CPU ${metricas.msCPU} ms | draw ${metricas.llamadasDibujo} | ${ajustes.perfil}`;
    tiempo=0;cuadros=0;cpu=0;
  }
  window.addEventListener('resize',()=>perfil(ajustes.perfil));
  return {antes,despues,perfil,metricas,ajustes};
}

exports.crearMonitorRendimiento = crearMonitorRendimiento;
},
"./salaMapasGaleria.js": function(module, exports, __require) {
const THREE = __THREE;


const CUADROS_MAPAS = Object.freeze([
  {
    "id": "cuadro-1",
    "titulo": "Un mapa de recuerdos",
    "x": 8.9,
    "y": 12.9,
    "z": -17.53,
    "w": 2.35,
    "h": 2.5,
    "rot": 0
  },
  {
    "id": "cuadro-2",
    "titulo": "Instantes para guardar",
    "x": 11.9,
    "y": 12.9,
    "z": -17.53,
    "w": 2.35,
    "h": 2.5,
    "rot": 0
  },
  {
    "id": "cuadro-3",
    "titulo": "Un rincón para sonreír",
    "x": 14.9,
    "y": 12.9,
    "z": -17.53,
    "w": 2.35,
    "h": 2.5,
    "rot": 0
  },
  {
    "id": "cuadro-4",
    "titulo": "La magia de lo sencillo",
    "x": 17.9,
    "y": 12.9,
    "z": -17.53,
    "w": 2.35,
    "h": 2.5,
    "rot": 0
  },
  {
    "id": "cuadro-5",
    "titulo": "Donde nace la alegría",
    "x": 19.48,
    "y": 12.9,
    "z": -5.1,
    "w": 2.65,
    "h": 2.9,
    "rot": -1.5707963267948966
  },
  {
    "id": "cuadro-6",
    "titulo": "Recuerdos que abrazan",
    "x": 19.48,
    "y": 12.9,
    "z": -9,
    "w": 2.65,
    "h": 2.9,
    "rot": -1.5707963267948966
  },
  {
    "id": "cuadro-7",
    "titulo": "Un día para volver",
    "x": 19.48,
    "y": 12.9,
    "z": -15.1,
    "w": 2.65,
    "h": 2.9,
    "rot": -1.5707963267948966
  },
  {
    "id": "cuadro-8",
    "titulo": "Entre luz y compañía",
    "x": 8.9,
    "y": 12.9,
    "z": -2.39,
    "w": 2.35,
    "h": 2.5,
    "rot": 3.141592653589793
  },
  {
    "id": "cuadro-9",
    "titulo": "Pequeñas grandes historias",
    "x": 11.9,
    "y": 12.9,
    "z": -2.39,
    "w": 2.35,
    "h": 2.5,
    "rot": 3.141592653589793
  },
  {
    "id": "cuadro-10",
    "titulo": "El hogar en una mirada",
    "x": 14.9,
    "y": 12.9,
    "z": -2.39,
    "w": 2.35,
    "h": 2.5,
    "rot": 3.141592653589793
  },
  {
    "id": "cuadro-11",
    "titulo": "Caminos que compartimos",
    "x": 17.9,
    "y": 12.9,
    "z": -2.39,
    "w": 2.35,
    "h": 2.5,
    "rot": 3.141592653589793
  },
  {
    "id": "cuadro-12",
    "titulo": "Un pedacito de felicidad",
    "x": 7.39,
    "y": 12.9,
    "z": -14.6,
    "w": 2.5,
    "h": 2.7,
    "rot": 1.5707963267948966
  },
  {
    "id": "cuadro-13",
    "titulo": "Siempre en nuestra memoria",
    "x": 7.39,
    "y": 12.9,
    "z": -5.1,
    "w": 2.5,
    "h": 2.7,
    "rot": 1.5707963267948966
  }
]);

function crearSalaMapasGaleria(escena,camara,castillo,elemento,opciones={}){
  if(castillo.userData.galeriaMapas)return castillo.userData.galeriaMapas;
  const ROOM='Sala de mapas',raiz=new THREE.Group();raiz.name='Sala de mapas · Galería de recuerdos';castillo.add(raiz);
  const geometrias=new Set(),materiales=new Set(),texturas=new Set(),propios=[],ocultos=[],retirados=[];
  const colisiones=castillo.userData.colisiones;
  const cajaGeo=new THREE.BoxGeometry(1,1,1),esferaGeo=new THREE.SphereGeometry(1,20,14),peloGeo=new THREE.SphereGeometry(1,7,5);
  [cajaGeo,esferaGeo,peloGeo].forEach(g=>geometrias.add(g));
  const marcar=o=>{Object.assign(o.userData,{habitacion:ROOM,noAgrupar:true,dinamico:true});return o;};marcar(raiz);
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});materiales.add(m);return m;}
  const marfil=material('#e0d5bc'),nogal=material('#3e3029'),oro=material('#c3a065',{metalness:.55,roughness:.4}),azul=material('#334b60');
  const lienzoFondo=material('#eee4cd'),piedraClara=material('#b9b4a5');
  function caja(nombre,x,y,z,w,h,d,mat,padre=raiz,solido=false){
    const o=marcar(new THREE.Mesh(cajaGeo,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;padre.add(o);
    if(solido&&Array.isArray(colisiones)){const r={mesh:o,w,h,d,esCaja:true};colisiones.push(r);propios.push(r);}return o;
  }
  function esfera(nombre,x,y,z,sx,sy,sz,mat,padre=raiz){const o=marcar(new THREE.Mesh(esferaGeo,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function tex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;texturas.add(t);return t;}
  function plano(c,w,h,x,y,z,padre=raiz){
    const g=new THREE.PlaneGeometry(w,h);geometrias.add(g);const m=new THREE.MeshBasicMaterial({map:tex(c),toneMapped:false});materiales.add(m);
    const o=marcar(new THREE.Mesh(g,m));o.position.set(x,y,z);padre.add(o);return o;
  }
  // Retirar únicamente el mobiliario antiguo que está dentro de esta habitación.
  castillo.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),bb=new THREE.Box3();
  const zona=new THREE.Box3(new THREE.Vector3(7.35,9.99,-17.8),new THREE.Vector3(19.7,16.95,-2.32));
  castillo.traverse(o=>{
    if(!o.isMesh||!/^(Mesa|Armario)(\s|$)/i.test(o.name))return;
    bb.setFromObject(o).applyMatrix4(inv);if(zona.containsBox(bb))ocultos.push({objeto:o,visible:o.visible});
  });ocultos.forEach(r=>r.objeto.visible=false);
  if(Array.isArray(colisiones)){const quitar=new Set(ocultos.map(r=>r.objeto));for(let i=colisiones.length-1;i>=0;i--)if(quitar.has(colisiones[i].mesh))retirados.push({indice:i,valor:colisiones.splice(i,1)[0]});}
  // Revestimientos locales. La puerta oeste y la ventana oriental quedan libres.
  caja('Galería · Pared posterior',13.5,13.5,-17.585,12.3,6.96,.018,marfil);
  caja('Galería · Pared oriental',19.585,13.5,-9.96,.018,6.96,15.25,marfil);
  caja('Galería · Pared frontal',13.5,13.5,-2.315,12.3,6.96,.018,marfil);
  caja('Galería · Pared oeste norte',7.335,13.5,-14.5,.018,6.96,6.34,marfil);
  caja('Galería · Pared oeste sur',7.335,13.5,-5.5,.018,6.96,6.34,marfil);
  caja('Galería · Dintel',7.335,15.3,-10,.018,3.36,2.66,marfil);
  const piso=material('#76563d');caja('Galería · Suelo de nogal',13.46,10.05,-9.98,12.2,.012,15.22,piso);
  const vetas=canvas(512,512),vc=vetas.getContext('2d');vc.fillStyle='#795b43';vc.fillRect(0,0,512,512);
  for(let i=0;i<8;i++){vc.fillStyle=i%2?'#87684c':'#71523d';vc.fillRect(0,i*64,512,64);vc.strokeStyle='#392e2666';vc.lineWidth=2;vc.strokeRect(0,i*64,512,64);for(let j=0;j<6;j++){vc.beginPath();vc.moveTo(0,i*64+10+j*8);vc.bezierCurveTo(170,i*64+j*8,340,i*64+18+j*8,512,i*64+9+j*8);vc.stroke();}}
  const tp=tex(vetas);tp.wrapS=tp.wrapT=THREE.RepeatWrapping;tp.repeat.set(3,4);piso.map=tp;piso.color.set('#ffffff');
  for(const z of [-17.48,-2.43]){caja('Galería · Zócalo',13.45,10.32,z,12.2,.45,.14,nogal);caja('Galería · Moldura alta',13.45,15.55,z,12.2,.08,.1,oro);}
  caja('Galería · Zócalo este',19.48,10.32,-10,.14,.45,15.1,nogal);
  const alf=canvas(512,512),ac=alf.getContext('2d');ac.fillStyle='#243d51';ac.fillRect(0,0,512,512);
  for(const d of [12,22,43]){ac.strokeStyle=d===22?'#bba16d':'#65788a';ac.lineWidth=3;ac.strokeRect(d,d,512-2*d,512-2*d);}
  ac.translate(256,256);ac.strokeStyle='#c4ae7c';ac.lineWidth=2;
  for(let i=0;i<8;i++){ac.rotate(Math.PI/4);ac.beginPath();ac.moveTo(0,-100);ac.lineTo(12,-25);ac.lineTo(0,-40);ac.lineTo(-12,-25);ac.closePath();ac.stroke();}
  const alfombra=plano(alf,5.7,8.2,13.4,10.071,-10.1);alfombra.rotation.x=-Math.PI/2;
  caja('Galería · Banco',13.5,10.57,-4.6,3.8,.54,1.1,azul,raiz,true);
  for(const x of [12,15])for(const z of [-4.98,-4.22])caja('Galería · Pata de banco',x,10.26,z,.14,.4,.14,oro);
  const placa=canvas(768,256),pc=placa.getContext('2d');pc.fillStyle='#233943';pc.fillRect(0,0,768,256);pc.strokeStyle='#c6a868';pc.lineWidth=5;pc.strokeRect(12,12,744,232);pc.fillStyle='#f1dfb4';pc.textAlign='center';pc.font='40px Georgia';pc.fillText('GALERÍA DE RECUERDOS',384,112);pc.font='22px Georgia';pc.fillText('Sala de mapas · Cada imagen guarda un viaje',384,174);
  plano(placa,5.6,1.6,13.5,15.6,-17.53);
  // Dos macetas, fuera del recorrido principal.
  const hojaMat=material('#425e42'),barro=material('#9b6a4d');
  for(const x of [8.2,18.6]){
    const g=new THREE.CylinderGeometry(.34,.26,.65,14);geometrias.add(g);const maceta=marcar(new THREE.Mesh(g,barro));maceta.position.set(x,10.39,-3.25);raiz.add(maceta);
    for(let i=0;i<5;i++){const a=i*2.4;const h=esfera('Galería · Follaje',x+Math.cos(a)*.2,11.15+(i%2)*.25,-3.25+Math.sin(a)*.2,.19,.55,.14,hojaMat);h.rotation.z=Math.cos(a)*.4;}
  }
  // Cuadros con molduras en capas, esquinas talladas y etiquetas.
  const cuadros=[],seleccionables=[];
  function dibujarInicial(c,n){
    const ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.fillStyle=['#ddd0ad','#d7c9b7','#b9c6b2'][n%3];ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#74644966';ctx.lineWidth=1;
    for(let i=1;i<12;i++){ctx.beginPath();ctx.moveTo(i*w/12,0);ctx.lineTo(i*w/12,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*h/12);ctx.lineTo(w,i*h/12);ctx.stroke();}
    ctx.fillStyle='#799183';ctx.beginPath();ctx.moveTo(0,h*.7);for(let i=0;i<9;i++)ctx.lineTo(i*w/8,h*(.38+((i*7+n*3)%9)/30));ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    ctx.strokeStyle='#e3d3a0';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(w*.15,h*.9);ctx.bezierCurveTo(w*.7,h*.45,w*.1,h*.3,w*.85,h*.14);ctx.stroke();
    ctx.fillStyle='#434b4d';const xx=w*.57,yy=h*.43;ctx.fillRect(xx,yy,w*.16,h*.2);for(const dx of [-.02,.13]){ctx.fillRect(xx+dx*w,yy-h*.08,w*.06,h*.28);ctx.beginPath();ctx.moveTo(xx+(dx-.01)*w,yy-h*.08);ctx.lineTo(xx+(dx+.03)*w,yy-h*.15);ctx.lineTo(xx+(dx+.07)*w,yy-h*.08);ctx.fill();}
    ctx.strokeStyle='#f8edcd';ctx.lineWidth=3;ctx.strokeRect(18,18,w-36,h-36);ctx.fillStyle='#f7edcc';ctx.textAlign='center';ctx.font=`${Math.round(w*.036)}px Georgia`;ctx.fillText('UN RECUERDO POR COLOCAR',w/2,h*.86);ctx.font=`${Math.round(w*.026)}px Georgia`;ctx.fillText('Abre la galería para elegir tu imagen',w/2,h*.915);
  }
  function rotulo(c,titulo){const ctx=c.getContext('2d');ctx.fillStyle='#e6d9bd';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#473e35';ctx.textAlign='center';let tam=30;do{ctx.font=`${tam}px Georgia`;if(ctx.measureText(titulo).width<c.width-30)break;tam--;}while(tam>12);ctx.fillText(titulo,c.width/2,c.height*.64);}
  CUADROS_MAPAS.forEach((d,i)=>{
    const g=new THREE.Group();g.name='Galería · Marco '+d.id;g.position.set(d.x,d.y,d.z);g.rotation.y=d.rot;raiz.add(g);
    caja('Galería · Fondo de cuadro',0,0,0,d.w+.22,d.h+.22,.14,nogal,g);
    for(const x of [-d.w/2,d.w/2]){caja('Galería · Marco tallado',x,0,.10,.17,d.h+.28,.15,oro,g);caja('Galería · Filete interior',x-Math.sign(x)*.11,0,.17,.035,d.h,.045,piedraClara,g);}
    for(const y of [-d.h/2,d.h/2]){caja('Galería · Marco tallado',0,y,.10,d.w+.28,.17,.15,oro,g);caja('Galería · Filete interior',0,y-Math.sign(y)*.11,.17,d.w,.035,.045,piedraClara,g);}
    for(const x of [-d.w/2,d.w/2])for(const y of [-d.h/2,d.h/2]){const adorno=esfera('Galería · Esquina labrada',x,y,.20,.12,.12,.055,oro,g);adorno.rotation.z=Math.PI/4;}
    const ancho=d.w/d.h>=1?768:Math.round(768*d.w/d.h),alto=d.w/d.h>=1?Math.round(768*d.h/d.w):768;
    const c=canvas(ancho,alto);dibujarInicial(c,i);const o=plano(c,d.w-.26,d.h-.26,0,0,.19,g);o.userData.cuadro=d.id;seleccionables.push(o);
    const label=canvas(768,90);rotulo(label,d.titulo);const cartel=plano(label,2.6,.30,0,-d.h/2-.37,.11,g);
    // Aplique decorativo; no añade una luz por cuadro.
    caja('Galería · Aplique',0,d.h/2+.34,.18,.72,.10,.22,oro,g);
    cuadros.push({def:d,canvas:c,mesh:o,label,cartel,titulo:d.titulo,publicado:null,local:null,version:0});
  });
  const luz=new THREE.PointLight(0xffdfb6,28,13,2);luz.position.set(13.3,15.5,-10);luz.castShadow=false;raiz.add(luz);marcar(luz);
  // GALERIA_FIJA_13_TECHO_PERRO_V2
  // Artesonado local de madera, paños azules, filetes dorados y medallón celeste.
  caja('Galería · Base del artesonado',13.5,16.60,-10,12.2,.10,15.2,nogal);
  const panoTecho=material('#344d61',{roughness:.94});
  for(const x of [8.95,11.95,14.95,17.95])for(const z of [-15.7,-11.9,-8.1,-4.3]){
    caja('Galería · Casetón azul',x,16.525,z,2.76,.045,3.52,panoTecho);
    for(const dx of [-1.30,1.30])caja('Galería · Filete del casetón',x+dx,16.49,z,.025,.025,3.32,oro);
    for(const dz of [-1.65,1.65])caja('Galería · Filete del casetón',x,16.49,z+dz,2.62,.025,.025,oro);
    esfera('Galería · Florón del casetón',x,16.47,z,.11,.045,.11,oro);
  }
  for(const x of [7.45,10.45,13.45,16.45,19.45]){
    caja('Galería · Viga longitudinal',x,16.44,-10,.15,.22,15.2,nogal);
    caja('Galería · Perfil dorado de viga',x,16.32,-10,.035,.025,15.15,oro);
  }
  for(const z of [-17.6,-13.8,-10,-6.2,-2.4]){
    caja('Galería · Viga transversal',13.45,16.435,z,12.15,.23,.15,nogal);
    caja('Galería · Perfil dorado transversal',13.45,16.31,z,12.15,.025,.035,oro);
  }
  const cielo=canvas(768,768),ct=cielo.getContext('2d');ct.fillStyle='#1f354b';ct.fillRect(0,0,768,768);ct.strokeStyle='#c8ab70';ct.lineWidth=5;ct.strokeRect(15,15,738,738);ct.lineWidth=2;ct.strokeRect(30,30,708,708);
  ct.translate(384,384);ct.strokeStyle='#dec58b';ct.lineWidth=3;
  for(let i=0;i<16;i++){ct.save();ct.rotate(i*Math.PI/8);ct.beginPath();ct.moveTo(0,-290);ct.lineTo(25,-64);ct.lineTo(0,-102);ct.lineTo(-25,-64);ct.closePath();ct.stroke();ct.restore();}
  ct.beginPath();ct.arc(0,0,65,0,Math.PI*2);ct.stroke();ct.font='30px Georgia';ct.textAlign='center';ct.fillStyle='#efdbad';ct.fillText('N',0,-305);ct.fillText('S',0,327);ct.fillText('E',321,12);ct.fillText('O',-321,12);
  for(let i=0;i<32;i++){const a=i*2.39996,r=110+(i*73%230);ct.fillStyle='#f3d99b';ct.beginPath();ct.arc(Math.cos(a)*r,Math.sin(a)*r,2+(i%2),0,Math.PI*2);ct.fill();}
  const medallon=plano(cielo,3.1,3.1,13.45,16.29,-10);medallon.rotation.x=Math.PI/2;
  const geoAro=new THREE.TorusGeometry(.85,.045,8,40);geometrias.add(geoAro);
  const aro=marcar(new THREE.Mesh(geoAro,oro));aro.name='Galería · Aro de la lámpara';aro.rotation.x=Math.PI/2;aro.position.set(13.45,15.35,-10);raiz.add(aro);
  caja('Galería · Soporte de lámpara',13.45,15.82,-10,.055,.93,.055,oro);
  const luzVela=material('#ffe2a0',{emissive:'#ffc472',emissiveIntensity:1.4});
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=13.45+Math.cos(a)*.82,z=-10+Math.sin(a)*.82;
    caja('Galería · Vela de lámpara',x,15.51,z,.085,.30,.085,marfil);
    esfera('Galería · Llama ornamental',x,15.70,z,.045,.09,.045,luzVela);
  }
  // Perrito estilizado inspirado en la referencia: pelo blanco, orejas oscuras,
  // máscara marrón, ojos grandes y hocico corto con barba. No es un modelo fotorealista.
  const perro=new THREE.Group();perro.name='Galería · Perrito guardián';perro.position.set(13.2,10.18,-11.1);perro.rotation.y=-Math.PI/2;perro.scale.setScalar(.72);raiz.add(perro);marcar(perro);
  const blanco=material('#eee9dc'),blancoCalido=material('#d4cbb8'),cafe=material('#594039'),oscuro=material('#302a2a');
  const negro=material('#171719',{roughness:.22}),brillo=material('#ffffff',{roughness:.1}),collarMat=material('#567484');
  const cuerpo=new THREE.Group();perro.add(cuerpo);
  esfera('Perrito · Cuerpo',0,.62,-.16,.48,.57,.63,blanco,cuerpo);
  esfera('Perrito · Pecho',0,.66,.23,.39,.51,.36,blanco,cuerpo);
  for(const x of [-.31,.31]){esfera('Perrito · Patita trasera',x,.22,-.34,.24,.23,.3,blanco,cuerpo);esfera('Perrito · Pata delantera',x*.8,.36,.30,.14,.29,.16,blanco,cuerpo);esfera('Perrito · Huellita',x*.8,.14,.4,.17,.12,.24,blancoCalido,cuerpo);}
  const cabeza=new THREE.Group();cabeza.position.set(0,1.24,.32);cuerpo.add(cabeza);
  esfera('Perrito · Cabeza',0,0,0,.53,.47,.46,blanco,cabeza);
  esfera('Perrito · Coronilla oscura',0,.15,-.09,.5,.37,.37,cafe,cabeza);
  for(const x of [-.23,.23])esfera('Perrito · Mancha del rostro',x,.07,.30,.28,.29,.20,cafe,cabeza);
  esfera('Perrito · Franja blanca',0,.19,.34,.125,.37,.15,blanco,cabeza);
  const ojos=[];
  for(const x of [-.225,.225]){
    const ojo=new THREE.Group();ojo.position.set(x,.075,.476);cabeza.add(ojo);ojos.push(ojo);
    esfera('Perrito · Ojo',0,0,0,.102,.109,.074,negro,ojo);esfera('Perrito · Reflejo',-.026,.035,.064,.026,.026,.014,brillo,ojo);
    esfera('Perrito · Reflejo pequeño',.027,-.023,.069,.012,.012,.008,brillo,ojo);
    esfera('Perrito · Ceja clara',x,.245,.43,.18,.07,.075,blanco,cabeza);
  }
  for(const x of [-.145,.145])esfera('Perrito · Bigote',x,-.205,.50,.22,.15,.20,blanco,cabeza);
  esfera('Perrito · Barba',0,-.37,.32,.33,.24,.21,blanco,cabeza);
  esfera('Perrito · Nariz',0,-.10,.689,.11,.079,.074,negro,cabeza);
  esfera('Perrito · Brillo de nariz',-.025,-.077,.753,.028,.012,.008,brillo,cabeza);
  const boca=material('#6c4847');esfera('Perrito · Sonrisa',0,-.29,.55,.12,.028,.025,boca,cabeza);
  const lenguaMat=material('#cf8790',{transparent:true,opacity:0,depthWrite:false});esfera('Perrito · Lengüita',0,-.33,.59,.06,.074,.018,lenguaMat,cabeza);
  let semilla=13579;const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  function pelo(padre,cantidad,muestreo,mat){
    const lote=marcar(new THREE.InstancedMesh(peloGeo,mat,cantidad));lote.name='Perrito · Mechones agrupados';const dummy=new THREE.Object3D();
    for(let i=0;i<cantidad;i++){const p=muestreo(i);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx??.055,p.sy??.11,p.sz??.05);dummy.rotation.set(p.rx??0,p.ry??0,p.rz??0);dummy.updateMatrix();lote.setMatrixAt(i,dummy.matrix);}
    lote.instanceMatrix.needsUpdate=true;lote.computeBoundingSphere();lote.castShadow=lote.receiveShadow=true;padre.add(lote);return lote;
  }
  pelo(cuerpo,110,()=>{const u=azar()*Math.PI*2,v=Math.acos(2*azar()-1);return{x:.48*Math.sin(v)*Math.cos(u),y:.63+.55*Math.cos(v),z:-.13+.61*Math.sin(v)*Math.sin(u),sy:.08+azar()*.08,rz:(azar()-.5)*.6};},blanco);
  for(const lado of [-1,1]){
    const oreja=new THREE.Group();oreja.position.set(lado*.49,-.08,-.015);oreja.rotation.z=lado*.10;cabeza.add(oreja);
    esfera('Perrito · Oreja caída',0,-.13,0,.205,.43,.23,oscuro,oreja);
    pelo(oreja,46,()=>{const u=azar()*Math.PI*2,v=Math.acos(2*azar()-1);return{x:.18*Math.sin(v)*Math.cos(u),y:-.13+.39*Math.cos(v),z:.21*Math.sin(v)*Math.sin(u),sx:.038,sy:.14+azar()*.08,sz:.035,rz:lado*.1};},cafe);
    pelo(cabeza,13,()=>({x:lado*(.10+azar()*.22),y:-.24-azar()*.12,z:.54+azar()*.07,sx:.035,sy:.13+azar()*.06,sz:.035,rz:lado*(-.25-azar()*.55)}),blanco);
  }
  pelo(cabeza,28,()=>({x:(azar()-.5)*.29,y:.31+azar()*.12,z:.12+azar()*.27,sx:.045,sy:.12+azar()*.06,sz:.045,rz:(azar()-.5)*.8}),blanco);
  const cola=new THREE.Group();cola.position.set(0,.66,-.66);cuerpo.add(cola);
  const tg=new THREE.TorusGeometry(.25,.095,9,25,Math.PI*1.7);geometrias.add(tg);const rizo=marcar(new THREE.Mesh(tg,blanco));rizo.position.set(.13,.15,-.03);cola.add(rizo);
  esfera('Perrito · Punta de cola',.28,.39,-.03,.11,.16,.11,blanco,cola);
  const cg=new THREE.TorusGeometry(.31,.037,8,24);geometrias.add(cg);const collar=marcar(new THREE.Mesh(cg,collarMat));collar.rotation.x=Math.PI/2;collar.position.set(0,.96,.18);cuerpo.add(collar);
  esfera('Perrito · Medalla',0,.84,.45,.075,.085,.025,oro,cuerpo);
  const coj=material('#667f85');esfera('Galería · Cojín del perrito',13.2,10.13,-11.1,.91,.065,.72,coj);
  const proxyMat=material('#ffffff');proxyMat.visible=false;
  const proxy=caja('Galería · Colisión del perrito',13.2,10.84,-11.1,1.55,1.32,.94,proxyMat,raiz,true);proxy.castShadow=proxy.receiveShadow=false;
  // Galería fija: únicamente archivos publicados. Sin IndexedDB ni editor.
  const carpeta=new URL('./assets/galeriaMapas/',document.baseURI);
  const baseProyecto=new URL('./',document.baseURI),assetsPermitidos=new URL('./assets/',document.baseURI);
  let liberado=false,controles=null,oclusion=null,abierto=false,dentro=false,cercaPerro=false,indice=0,modo='perro';
  let reloj=0,accion=null,avisoCarga='Cargando los trece recuerdos…';
  const localCam=new THREE.Vector3(),paraPerro=new THREE.Vector3();
  const abortador=new AbortController();
  // Una patita articulada reutiliza las piezas del modelo que ya está instalado.
  const patita=new THREE.Group();patita.name='Perrito · Articulación de saludo';patita.position.set(.248,.55,.30);cuerpo.add(patita);
  const piezasPatita=[...cuerpo.children].filter(o=>o!==patita&&o.position.x>0&&['Perrito · Pata delantera','Perrito · Huellita'].includes(o.name));
  cuerpo.updateWorldMatrix(true,true);piezasPatita.forEach(o=>patita.attach(o));
  const pelota=new THREE.Group();pelota.name='Perrito · Pelota de juego';perro.add(pelota);
  const goma=material('#bf6b5b',{roughness:.5});esfera('Perrito · Pelota',0,0,0,.19,.19,.19,goma,pelota);
  const gp=new THREE.TorusGeometry(.186,.014,7,24);geometrias.add(gp);
  for(const giro of [0,Math.PI/2]){const aro=marcar(new THREE.Mesh(gp,azul));aro.rotation.y=giro;pelota.add(aro);}
  // La escala oculta el juguete sin interferir con los cambios de visibilidad de la oclusión.
  pelota.scale.setScalar(.0001);pelota.position.set(0,.3,1.05);
  const premio=new THREE.Group();premio.name='Perrito · Galletita animada';cabeza.add(premio);premio.position.set(.03,-.15,.82);premio.rotation.x=Math.PI/2;
  const gm=new THREE.CylinderGeometry(.12,.12,.045,14);geometrias.add(gm);
  const galletaMat=material('#c79557',{roughness:.95}),galleta=marcar(new THREE.Mesh(gm,galletaMat));premio.add(galleta);
  const relieveGalleta=material('#80603d');
  for(let i=0;i<5;i++){const a=i*2.4;esfera('Perrito · Relieve de galletita',Math.cos(a)*.065,.026,Math.sin(a)*.065,.012,.008,.012,relieveGalleta,premio);}
  premio.scale.setScalar(.0001);
  function imagenURL(url){return new Promise((resolve,reject)=>{
    const im=new Image();const timer=setTimeout(()=>{im.onload=im.onerror=null;im.src='';reject(new Error('La imagen tardó demasiado en cargar.'));},18000);
    im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(new Error('No se encontró la imagen publicada.'));};im.src=url;
  });}
  function pintarImagen(c,im){const ctx=c.getContext('2d');ctx.fillStyle='#efe6d1';ctx.fillRect(0,0,c.width,c.height);const s=Math.min(c.width/im.width,c.height/im.height),w=im.width*s,h=im.height*s;ctx.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);}
  async function cargar(){
    const timer=setTimeout(()=>abortador.abort(),12000);
    try{
      const r=await fetch(new URL('galeria.json',carpeta),{cache:'no-store',signal:abortador.signal});
      if(!r.ok)throw new Error('No se encontró assets/galeriaMapas/galeria.json.');
      const datos=await r.json();if(!Array.isArray(datos.cuadros)||datos.cuadros.length!==13)throw new Error('galeria.json debe contener los trece cuadros.');
      const ids=new Set(datos.cuadros.map(c=>c.id));if(ids.size!==13||!cuadros.every(f=>ids.has(f.def.id)))throw new Error('Los identificadores de galeria.json no coinciden con los trece cuadros.');
      const fallos=[];
      // Carga con tres tareas simultáneas para evitar decodificar las 13 fotos a la vez.
      let cursor=0;
      async function trabajador(){while(cursor<cuadros.length&&!liberado){
        const f=cuadros[cursor++],item=datos.cuadros.find(c=>c.id===f.def.id);
        try{
          if(typeof item.archivo!=='string'||!item.archivo)throw new Error('Falta el nombre de la imagen.');
          const u=new URL(item.archivo,baseProyecto);if(u.origin!==assetsPermitidos.origin||!u.href.startsWith(assetsPermitidos.href))throw new Error('La imagen debe pertenecer a assets/ de este proyecto.');
          const im=await imagenURL(u.href);if(liberado)return;
          pintarImagen(f.canvas,im);f.titulo=String(item.titulo||f.def.titulo).slice(0,90);rotulo(f.label,f.titulo);f.mesh.material.map.needsUpdate=f.cartel.material.map.needsUpdate=true;
          if(abierto&&modo==='foto'&&cuadros[indice]===f)interfaz();
        }catch(e){if(!liberado)fallos.push(`${f.def.id}: ${e.message}`);}
      }}
      await Promise.all([trabajador(),trabajador(),trabajador()]);
      if(!liberado)avisoCarga=fallos.length?`No cargaron ${fallos.length} imágenes. Revisa que hayas publicado la carpeta completa.\n${fallos.join('\n')}`:'13 recuerdos · Galería de solo lectura';
    }catch(e){if(!liberado)avisoCarga=e.message;}
    finally{clearTimeout(timer);if(!liberado&&abierto)interfaz();}
  }
  const id='galeria-mapas',estilo=document.createElement('style');estilo.textContent=`
  #${id}[hidden],#${id} [hidden],#${id}-acciones[hidden]{display:none!important}
  #${id},#${id}-acciones{font:14px/1.5 system-ui,sans-serif;color:#f5e8ce;box-sizing:border-box}
  #${id}{position:fixed;inset:0;z-index:31000;display:flex;justify-content:center;align-items:flex-end;padding:15px;background:transparent}
  #${id}.gm-modo-foto{align-items:center;background:#10151ce8}
  #${id} *{box-sizing:border-box}
  #${id} .gm-caja{position:relative;width:min(880px,100%);max-height:calc(100dvh - 30px);overflow:auto;padding:22px;background:#1f3039f5;border:1px solid #b99c63;border-radius:18px;box-shadow:0 14px 55px #0008}
  #${id} h2{font:27px Georgia,serif;color:#f6dfad;margin:0 65px 10px 0}
  #${id} .gm-cerrar{position:absolute;right:13px;top:13px}
  #${id} button,#${id}-acciones button{min-height:44px;padding:10px 14px;border:1px solid #b59b61;border-radius:9px;background:#344950;color:#f5e8ce;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
  #${id} button:hover,#${id}-acciones button:hover{background:#4a626b}
  #${id} button:disabled{opacity:.5;cursor:wait}
  #${id} :focus-visible,#${id}-acciones :focus-visible{outline:3px solid #f0cb7b;outline-offset:3px}
  #${id} .gm-botones{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}
  #${id} canvas{display:block;max-width:100%;max-height:65dvh;width:auto;height:auto;margin:auto;border:8px ridge #b6975b}
  #${id} .gm-aviso{white-space:pre-line;color:#d5c398;font-size:13px;margin:10px 0 0}
  #${id} .gm-ayuda{color:#c7c6bd;margin:0 0 9px}
  #${id}-acciones{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:26;display:flex;gap:9px;max-width:92vw;width:max-content;flex-wrap:wrap;justify-content:center}
  #${id}-acciones button{background:#20343bee;box-shadow:0 5px 20px #0007}
  @media(max-width:600px){#${id}{padding:7px}#${id} .gm-caja{padding:18px 12px}#${id} h2{font-size:22px}#${id} button{font-size:12px;padding:10px}#${id} canvas{max-height:58dvh}}
  `;document.head.appendChild(estilo);
  const panel=document.createElement('section');panel.id=id;panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby',id+'-titulo');
  panel.innerHTML=`<div class="gm-caja"><button type="button" class="gm-cerrar">Cerrar</button><h2 id="${id}-titulo"></h2><div class="gm-foto"><canvas width="768" height="768" role="img" aria-label="Fotografía de la galería"></canvas><div class="gm-botones"><button type="button" class="gm-anterior">← Anterior</button><button type="button" class="gm-siguiente">Siguiente →</button></div></div><div class="gm-perro"><p class="gm-ayuda">Tu pequeño guardián está listo para pasar un rato contigo.</p><div class="gm-botones"><button type="button" data-accion="mimos">Acariciar</button><button type="button" data-accion="patita">Pedir la patita</button><button type="button" data-accion="pelota">Jugar con la pelota</button><button type="button" data-accion="galleta">Dar una galletita</button><button type="button" data-accion="descanso">Descansar</button></div></div><p class="gm-aviso" role="status" aria-live="polite"></p></div>`;document.body.appendChild(panel);
  const acciones=document.createElement('div');acciones.id=id+'-acciones';acciones.hidden=true;acciones.innerHTML='<button type="button" class="gm-abrir">R · Ver recuerdo</button><button type="button" class="gm-mimos">G · Acariciar</button>';document.body.appendChild(acciones);
  const titulo=panel.querySelector('h2'),preview=panel.querySelector('canvas'),aviso=panel.querySelector('.gm-aviso'),fotoDiv=panel.querySelector('.gm-foto'),perroDiv=panel.querySelector('.gm-perro');
  const cerrarBtn=panel.querySelector('.gm-cerrar'),abrirBtn=acciones.querySelector('.gm-abrir'),mimosBtn=acciones.querySelector('.gm-mimos'),botonesPerro=[...panel.querySelectorAll('[data-accion]')];
  const menu=document.getElementById('menu');
  const duraciones={mimos:3.5,patita:3.5,pelota:6,galleta:3.6,descanso:6};
  const mensajes={mimos:'Disfrutando los mimos…',patita:'¡Te está dando la patita!',pelota:'¡A jugar con la pelota!',galleta:'¡Una galletita para el pequeño guardián!',descanso:'Un momento tranquilo para descansar…'};
  function interfaz(){
    if(liberado)return;const esFoto=modo==='foto';panel.classList.toggle('gm-modo-foto',esFoto);fotoDiv.hidden=!esFoto;perroDiv.hidden=esFoto;
    if(esFoto){const f=cuadros[indice];titulo.textContent=f.titulo;preview.width=f.canvas.width;preview.height=f.canvas.height;preview.getContext('2d').drawImage(f.canvas,0,0);preview.setAttribute('aria-label',f.titulo);aviso.textContent=`${indice+1} / ${cuadros.length} · Solo lectura\n${avisoCarga}`;}
    else{titulo.textContent='El pequeño guardián';aviso.textContent=accion?mensajes[accion.tipo]:'Elige una interacción. Esc para cerrar.';}
    botonesPerro.forEach(b=>b.disabled=Boolean(accion));
  }
  function abrir(n=null){
    if(liberado||!dentro||abierto)return;
    if(Number.isInteger(n)){indice=THREE.MathUtils.clamp(n,0,cuadros.length-1);modo='foto';}else modo=cercaPerro?'perro':'foto';
    abierto=true;controles?.pausar?.();if(document.pointerLockElement){try{const p=document.exitPointerLock();p?.catch?.(()=>{});}catch{}}
    acciones.hidden=true;panel.hidden=false;if(menu)menu.hidden=true;interfaz();cerrarBtn.focus();
  }
  function cerrar(){if(!abierto)return;abierto=false;panel.hidden=true;if(menu){menu.hidden=false;document.getElementById('boton-iniciar')?.focus();}}
  function interactuar(tipo){
    if(liberado||accion||!cercaPerro||!Object.prototype.hasOwnProperty.call(duraciones,tipo))return;
    accion={tipo,t:0,duracion:duraciones[tipo]};if(abierto)interfaz();
  }
  function acariciar(){interactuar('mimos');}
  function cambiar(d){indice=(indice+d+cuadros.length)%cuadros.length;interfaz();}
  function cercano(){let n=0,d=Infinity;cuadros.forEach((f,i)=>{const x=localCam.distanceToSquared(new THREE.Vector3(f.def.x,f.def.y,f.def.z));if(x<d){d=x;n=i;}});return n;}
  const raycaster=new THREE.Raycaster(),centro=new THREE.Vector2();
  function clicMundo(){if(!dentro||abierto||document.pointerLockElement!==elemento)return;raycaster.setFromCamera(centro,camara);const g=raycaster.intersectObjects(seleccionables,false)[0];if(g&&g.distance<10)abrir(cuadros.findIndex(f=>f.mesh===g.object));}
  function teclado(e){
    if(abierto){
      if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
      if(modo==='foto'&&['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)cambiar(e.code==='ArrowLeft'?-1:1);return;}
      if(e.code==='Tab'){
        const lista=[...panel.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length),primero=lista[0],ultimo=lista[lista.length-1];
        if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
      }
      if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','KeyG','Space'].includes(e.code))e.stopImmediatePropagation();return;
    }
    if(!dentro||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable||Boolean(menu&&!menu.hidden))return;
    if(e.code==='KeyR'){e.preventDefault();e.stopImmediatePropagation();abrir(cercaPerro?null:cercano());}
    if(e.code==='KeyG'&&cercaPerro){e.preventDefault();e.stopImmediatePropagation();acariciar();}
  }
  function alDesbloquear(){if(abierto&&menu)menu.hidden=true;}
  cerrarBtn.addEventListener('click',cerrar);abrirBtn.addEventListener('click',()=>abrir(cercaPerro?null:cercano()));mimosBtn.addEventListener('click',acariciar);
  panel.querySelector('.gm-anterior').addEventListener('click',()=>cambiar(-1));panel.querySelector('.gm-siguiente').addEventListener('click',()=>cambiar(1));
  botonesPerro.forEach(b=>b.addEventListener('click',()=>interactuar(b.dataset.accion)));
  document.addEventListener('keydown',teclado,true);document.addEventListener('pointerlockchange',alDesbloquear);elemento.addEventListener('click',clicMundo);
  function actualizar(dt=0){
    if(liberado)return;const paso=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));reloj+=paso;
    castillo.updateWorldMatrix(true,false);camara.getWorldPosition(localCam);castillo.worldToLocal(localCam);
    dentro=localCam.x>7.3&&localCam.x<19.7&&localCam.z> -17.7&&localCam.z< -2.3&&localCam.y>10&&localCam.y<16.95;
    cercaPerro=dentro&&Math.hypot(localCam.x-perro.position.x,localCam.z-perro.position.z,localCam.y-(perro.position.y+.8))<3.1;
    const visible=oclusion?.habitaciones?.find(h=>h.id===ROOM)?.visible??true;raiz.visible=visible;luz.visible=visible;
    acciones.hidden=!dentro||abierto||Boolean(menu&&!menu.hidden);abrirBtn.textContent=cercaPerro?'R · Interactuar con el perrito':'R · Ver recuerdo';mimosBtn.hidden=!cercaPerro;
    if(accion){accion.t+=paso;if(accion.t>=accion.duracion){accion=null;if(abierto)interfaz();}}
    if(visible){
      const tipo=accion?.tipo,t=accion?.t??0,p=accion?Math.min(1,t/accion.duracion):0;
      const entrada=accion?Math.min(1,t/.35,(accion.duracion-t)/.35):0;
      paraPerro.copy(localCam).sub(perro.position).applyAxisAngle(THREE.Object3D.DEFAULT_UP,-perro.rotation.y);
      let giro=cercaPerro?THREE.MathUtils.clamp(Math.atan2(paraPerro.x,paraPerro.z),-.42,.42):Math.sin(reloj*.5)*.07;
      if(tipo==='pelota')giro=Math.sin(t*5)*.25;
      cabeza.rotation.y=THREE.MathUtils.damp(cabeza.rotation.y,giro,5,paso);
      const inclinar=tipo==='mimos' ? .18+Math.sin(t*3)*.05:tipo==='patita'?-.14:tipo==='descanso' ? .09:Math.sin(reloj*.8)*.025;
      cabeza.rotation.z=THREE.MathUtils.damp(cabeza.rotation.z,inclinar,5,paso);
      cabeza.rotation.x=tipo==='galleta'?Math.sin(t*16)*.05:tipo==='pelota'?-.04+Math.sin(t*5)*.09:tipo==='descanso' ? .20*entrada:Math.sin(reloj*.8)*.022;
      cola.rotation.y=Math.sin(reloj*(tipo==='descanso'?1:tipo?14:cercaPerro?8:2.8))*(tipo==='descanso' ? .025:tipo ? .58:cercaPerro ? .40:.12);
      cuerpo.scale.y=1+Math.sin(reloj*(tipo==='descanso'?1.5:2.3))*.009;
      cuerpo.position.y=THREE.MathUtils.damp(cuerpo.position.y,tipo==='descanso'?-.055:0,5,paso);
      const objetivo=tipo==='patita'?(-1.10+Math.sin(t*9)*.13)*entrada:tipo==='pelota'?(-.3-Math.abs(Math.sin(t*5))*.35)*entrada:0;
      patita.rotation.x=THREE.MathUtils.damp(patita.rotation.x,objetivo,10,paso);
      const ciclo=reloj%5.4,parpadeo=ciclo>5.15?1-.94*Math.sin((ciclo-5.15)/.25*Math.PI):1;
      ojos.forEach(o=>o.scale.y=tipo==='descanso'?Math.max(.06,1-.94*entrada):parpadeo);
      lenguaMat.opacity=['mimos','pelota','galleta'].includes(tipo)?entrada:0;
      pelota.scale.setScalar(tipo==='pelota'?Math.max(.0001,entrada):.0001);pelota.position.set(Math.sin(t*4)*.22,.23+Math.abs(Math.sin(t*5))*.55,1.10+Math.cos(t*4)*.08);pelota.rotation.x=t*3;pelota.rotation.z=t*2;
      const tam=tipo==='galleta'?Math.min(1,t/.35)*Math.max(0,1-Math.max(0,p-.4)/.5):0;premio.scale.setScalar(Math.max(.0001,tam));premio.rotation.z=Math.sin(t*8)*.12;
    }
    if(abierto&&!dentro)cerrar();if(abierto&&menu&&!menu.hidden)menu.hidden=true;
  }
  const listo=cargar();
  const api={raiz,perro,cuadros,actualizar,abrir,cerrar,acariciar,interactuar,listo,
    vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get abierto(){return abierto;},get soloLectura(){return true;},get accionActual(){return accion?.tipo??null;},
    liberar(){
      if(liberado)return;cerrar();liberado=true;abortador.abort();
      document.removeEventListener('keydown',teclado,true);document.removeEventListener('pointerlockchange',alDesbloquear);elemento.removeEventListener('click',clicMundo);
      panel.remove();acciones.remove();estilo.remove();raiz.removeFromParent();
      if(Array.isArray(colisiones)){for(const r of propios){const i=colisiones.indexOf(r);if(i>=0)colisiones.splice(i,1);}retirados.sort((a,b)=>a.indice-b.indice).forEach(r=>colisiones.splice(Math.min(r.indice,colisiones.length),0,r.valor));}
      ocultos.forEach(r=>r.objeto.visible=r.visible);for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();delete castillo.userData.galeriaMapas;
    }
  };castillo.userData.galeriaMapas=api;return api;
}

exports.CUADROS_MAPAS = CUADROS_MAPAS;
exports.crearSalaMapasGaleria = crearSalaMapasGaleria;
},
"./reconstruirLosaCompleta.js": function(module, exports, __require) {
const THREE = __THREE;


// Ejecutar despues de corregirTechoYTerraza, ANTES de agrupar y cachear colisiones.
function reconstruirLosaCompleta(castillo) {
  const cota=17.5,espesor=0.28,radio=4.08;
  const nombres=new Set([
    'Cornisa principal','Cubierta exterior oeste','Cubierta exterior este',
    'Cubierta exterior frontal','Cubierta exterior posterior','Salon superior oeste',
    'Salon superior este','Salon superior frente','Salon superior fondo',
    'Descanso tercer piso','Remate techo segundo piso','Umbral terraza'
  ]);
  const retirados=[];let materialOrigen=null;
  castillo.traverse(o=>{
    if(o.isMesh&&nombres.has(o.name)){
      retirados.push(o);
      if(!materialOrigen)materialOrigen=Array.isArray(o.material)?o.material[0]:o.material;
    }
  });
  if(!retirados.length)throw new Error('No se encuentran las piezas de tres pisos. Ejecuta este modulo despues de accesosTresPisos y techoYTerraza, antes de agruparEstructura.');
  const material=materialOrigen?.clone()||new THREE.MeshStandardMaterial({color:0xc9b992,roughness:0.9});
  material.side=THREE.DoubleSide;material.name='Losa continua pisos 2 y 3';
  for(const propiedad of ['map','bumpMap'])if(material[propiedad]) {
    material[propiedad]=material[propiedad].clone();material[propiedad].repeat.set(0.25,0.25);
    material[propiedad].offset.set(0,0);material[propiedad].needsUpdate=true;
  }
  for(const o of retirados){
    const lista=castillo.userData.colisiones;
    for(let i=lista.length-1;i>=0;i--)if(lista[i].mesh===o)lista.splice(i,1);
    o.removeFromParent();
  }
  const raiz=new THREE.Group();raiz.name='Losa continua segundo tercero';castillo.add(raiz);
  const circulo=[];
  for(let i=0;i<128;i++){const a=i*Math.PI*2/128;circulo.push(new THREE.Vector2(Math.cos(a)*radio,Math.sin(a)*radio));}
  function trazar(contorno) {
    const s=new THREE.Shape();s.moveTo(contorno[0].x,contorno[0].y);
    for(let i=1;i<contorno.length;i++)s.lineTo(contorno[i].x,contorno[i].y);
    s.closePath();return s;
  }
  // Coordenadas XY de la forma: Y se convierte en Z local al rotarla.
  // Centro del hueco en Z=-7; la cubierta abarca Z=-18..18 y X=-20..20.
  const forma=trazar([new THREE.Vector2(-20,-11),new THREE.Vector2(20,-11),new THREE.Vector2(20,25),new THREE.Vector2(-20,25)]);
  const hueco=new THREE.Path();
  const sentido=circulo.slice().reverse();hueco.moveTo(sentido[0].x,sentido[0].y);
  for(let i=1;i<sentido.length;i++)hueco.lineTo(sentido[i].x,sentido[i].y);
  hueco.closePath();forma.holes.push(hueco);
  function crearPieza(nombre,shape) {
    const g=new THREE.ExtrudeGeometry(shape,{depth:espesor,bevelEnabled:false,steps:1,curveSegments:1});
    g.rotateX(Math.PI/2);g.translate(0,cota,-7);g.computeBoundingSphere();g.computeBoundingBox();
    const o=new THREE.Mesh(g,material);o.name=nombre;o.castShadow=o.receiveShadow=true;raiz.add(o);return o;
  }
  crearPieza('Losa completa techo segundo piso',forma);
  // Un descanso recortado dentro del mismo hueco: no se superpone sobre la losa.
  function recortar(poligono,distancia) {
    const salida=[];
    for(let i=0;i<poligono.length;i++) {
      const a=poligono[i],b=poligono[(i+1)%poligono.length],da=distancia(a),db=distancia(b);
      if(da>=0)salida.push(a.clone());
      if((da>=0)!==(db>=0))salida.push(a.clone().lerp(b,da/(da-db)));
    }
    return salida;
  }
  let descanso=circulo.slice();
  for(const d of [p=>p.x-3,p=>0.9-p.y,p=>p.y+0.9])descanso=recortar(descanso,d);
  crearPieza('Descanso integrado tercer piso',trazar(descanso));
  const anterior=castillo.userData.alturaSuelo;
  castillo.userData.alturaSuelo=(x,z,pies)=>{
    const lx=x-castillo.position.x,lz=z-castillo.position.z;
    let y=anterior(x,z,pies);
    if(Math.abs(lx)>20||lz<-18||lz>18||pies-castillo.position.y+0.32<cota)return y;
    const enHueco=Math.hypot(lx,lz+7)<radio;
    const enDescanso=lx>=3&&Math.abs(lz+7)<=0.9;
    if(!enHueco||enDescanso)y=Math.max(y,cota+castillo.position.y);
    return y;
  };
  castillo.userData.losaCompleta={piezasRetiradas:retirados.map(o=>o.name),ancho:40,fondo:36,
    cotaLocal:cota,cotaMundo:cota+castillo.position.y,espesor,radioHueco:radio};
  return castillo.userData.losaCompleta;
}

exports.reconstruirLosaCompleta = reconstruirLosaCompleta;
},
"./entornoMontana.js": function(module, exports, __require) {
const THREE = __THREE;


function crearEntornoMontana(escena,camara,castillo) {
  const elevacion=6.04;
  // Meseta suficientemente amplia para edificio, escalera y patio existentes.
  function altura(x,z) {
    const distancia=Math.max(Math.abs(x)-27,Math.abs(z+9)-34,0);
    return 0.04+6*(1-THREE.MathUtils.smoothstep(distancia,0,28));
  }
  const terrenoGeo=new THREE.PlaneGeometry(116,132,116,132);
  terrenoGeo.rotateX(-Math.PI/2);terrenoGeo.translate(0,0,-9);
  const p=terrenoGeo.attributes.position,colores=[];
  const verde=new THREE.Color(),bajo=new THREE.Color(0x628148),alto=new THREE.Color(0x64734b);
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i),y=altura(x,z);p.setY(i,y);
    verde.copy(bajo).lerp(alto,y/elevacion);
    verde.multiplyScalar(0.94+0.06*Math.sin(x*0.8)*Math.cos(z*0.7));
    colores.push(verde.r,verde.g,verde.b);
  }
  terrenoGeo.setAttribute('color',new THREE.Float32BufferAttribute(colores,3));terrenoGeo.computeVertexNormals();
  const terrenoMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  const terreno=new THREE.Mesh(terrenoGeo,terrenoMat);terreno.name='Colina transitable';terreno.receiveShadow=true;escena.add(terreno);
  castillo.position.y+=elevacion;castillo.updateMatrixWorld(true);
  camara.position.y+=elevacion;
  // El antiguo sendero era plano. Se sustituye por uno ajustado a la pendiente.
  castillo.traverse(o=>{if(o.name==='Sendero exterior')o.visible=false;});
  const caminoGeo=new THREE.PlaneGeometry(4,36,1,72);caminoGeo.rotateX(-Math.PI/2);caminoGeo.translate(0,0,43);
  const cp=caminoGeo.attributes.position;
  for(let i=0;i<cp.count;i++)cp.setY(i,altura(cp.getX(i),cp.getZ(i))+0.035);
  caminoGeo.computeVertexNormals();
  const caminoMat=new THREE.MeshStandardMaterial({color:0xb1a181,roughness:1});
  const camino=new THREE.Mesh(caminoGeo,caminoMat);camino.name='Sendero en pendiente';camino.receiveShadow=true;escena.add(camino);
  const sueloAnterior=castillo.userData.alturaSuelo;
  const bloqueoAnterior=castillo.userData.bloqueado;

  let semilla=81;
  const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  const celdas=new Map(),colisionesArbol=new Map();
  const celda=18;
  const clave=(x,z)=>`${Math.floor(x/celda)},${Math.floor(z/celda)}`;
  const geos={tronco:new THREE.CylinderGeometry(0.18,0.27,1,7),
    copa:new THREE.ConeGeometry(1,1,8),arbusto:new THREE.IcosahedronGeometry(1,0),
    roca:new THREE.IcosahedronGeometry(1,0)};
  const mats={tronco:new THREE.MeshStandardMaterial({color:0x65472e,roughness:1}),
    copa:new THREE.MeshStandardMaterial({color:0x315f37,roughness:1}),
    arbusto:new THREE.MeshStandardMaterial({color:0x58733e,roughness:1}),
    roca:new THREE.MeshStandardMaterial({color:0x7c7c6c,roughness:1})};
  function colocar(tipo,x,z,escala,rotacion=0) {
    const k=clave(x,z);
    if(!celdas.has(k))celdas.set(k,{tronco:[],copa:[],arbusto:[],roca:[]});
    celdas.get(k)[tipo].push({x,y:altura(x,z),z,escala,rotacion});
  }
  let arboles=0;
  for(let intento=0;intento<2200&&arboles<240;intento++) {
    const x=(azar()-0.5)*152,z=(azar()-0.5)*152;
    // Sin vegetacion en el castillo/patio ni en la ruta de salida.
    if((Math.abs(x)<29&&z>-45&&z<27)||(Math.abs(x)<5&&z>18))continue;
    const s=0.8+azar()*0.7,r=azar()*Math.PI*2;
    colocar('tronco',x,z,s,r);colocar('copa',x,z,s,r);
    const k=clave(x,z);if(!colisionesArbol.has(k))colisionesArbol.set(k,[]);
    colisionesArbol.get(k).push({x,z,r:0.27*s});arboles++;
  }
  for(let i=0;i<220;i++) {
    const x=(azar()-0.5)*154,z=(azar()-0.5)*154;
    if((Math.abs(x)<29&&z>-45&&z<27)||(Math.abs(x)<5&&z>18))continue;
    colocar(i%3===0?'roca':'arbusto',x,z,0.35+azar()*0.7,azar()*Math.PI*2);
  }
  const sectores=[],dummy=new THREE.Object3D();
  for(const [k,contenido] of celdas)for(const tipo of Object.keys(geos)) {
    const items=contenido[tipo];if(!items.length)continue;
    const m=new THREE.InstancedMesh(geos[tipo],mats[tipo],items.length);
    m.name=`Vegetacion ${k} ${tipo}`;
    items.forEach((item,i)=>{
      const s=item.escala;let alto,ancho,profundidad,centro;
      if(tipo==='tronco'){alto=3*s;ancho=profundidad=s;centro=alto/2;}
      else if(tipo==='copa'){alto=5*s;ancho=profundidad=2*s;centro=3*s+alto/2-0.7*s;}
      else{alto=(tipo==='roca'?0.6:0.85)*s;ancho=1.1*s;profundidad=s;centro=alto*0.65;}
      dummy.position.set(item.x,item.y+centro,item.z);
      dummy.rotation.set(0,item.rotacion,0);dummy.scale.set(ancho,alto,profundidad);dummy.updateMatrix();
      m.setMatrixAt(i,dummy.matrix);
    });
    m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.computeBoundingBox();
    m.frustumCulled=true;
    // Sin sombras de vegetacion: coste menor y sin sombras que desaparezcan al descartarla.
    m.castShadow=false;m.receiveShadow=true;escena.add(m);sectores.push(m);
  }
  castillo.userData.alturaSuelo=(x,z,pies)=>{
    const terrenoY=altura(x,z);
    const lx=x-castillo.position.x,lz=z-castillo.position.z;
    const enMeseta=Math.abs(lx)<=27&&lz>=-21&&lz<=47;
    if(!enMeseta)return terrenoY;
    const local=sueloAnterior(x,z,pies-elevacion);
    return Math.max(terrenoY,local>0?local+elevacion:terrenoY);
  };
  castillo.userData.bloqueado=(x,z,pies,alto=1.7,radio=0.32)=>{
    if(bloqueoAnterior(x,z,pies,alto,radio))return true;
    const cx=Math.floor(x/celda),cz=Math.floor(z/celda);
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)
      for(const t of colisionesArbol.get(`${cx+dx},${cz+dz}`)||[])
        if(Math.hypot(x-t.x,z-t.z)<t.r+radio)return true;
    return false;
  };
  const ajustes={distanciaVegetacion:105};
  const stats={arboles,sectores:sectores.length,sectoresEnDistancia:0};
  function actualizar() {
    stats.sectoresEnDistancia=0;
    for(const s of sectores) {
      const b=s.boundingSphere;
      s.visible=b.center.distanceTo(camara.position)-b.radius<ajustes.distanciaVegetacion;
      // El descarte por vista lo hace Three.js por sector en el pase de render.
      if(s.visible)stats.sectoresEnDistancia++;
    }
  }
  return {actualizar,altura,ajustes,estadisticas:stats};
}

exports.crearEntornoMontana = crearEntornoMontana;
},
"./observatorioDeseos.js": function(module, exports, __require) {
const THREE = __THREE;


const CONSTELACIONES_DESEOS = Object.freeze([
  {
    "id": "corona",
    "nombre": "La corona",
    "puntos": [
      [
        0.18,
        0.75
      ],
      [
        0.1,
        0.18
      ],
      [
        0.32,
        0.45
      ],
      [
        0.5,
        0.1
      ],
      [
        0.68,
        0.45
      ],
      [
        0.9,
        0.18
      ],
      [
        0.82,
        0.75
      ],
      [
        0.8,
        0.88
      ],
      [
        0.2,
        0.88
      ]
    ],
    "aristas": [
      [
        0,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        0
      ]
    ],
    "mensaje": "Un reino no vale por su corona, sino por quienes encuentran refugio en él."
  },
  {
    "id": "corazon",
    "nombre": "El corazón",
    "puntos": [
      [
        0.5,
        0.87
      ],
      [
        0.16,
        0.53
      ],
      [
        0.1,
        0.3
      ],
      [
        0.18,
        0.12
      ],
      [
        0.34,
        0.1
      ],
      [
        0.5,
        0.29
      ],
      [
        0.66,
        0.1
      ],
      [
        0.82,
        0.12
      ],
      [
        0.9,
        0.3
      ],
      [
        0.84,
        0.53
      ]
    ],
    "aristas": [
      [
        0,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        9
      ],
      [
        9,
        0
      ]
    ],
    "mensaje": "Hay luces que no vienen de las estrellas, sino de las personas que nos acompañan."
  },
  {
    "id": "perrito",
    "nombre": "El pequeño guardián",
    "puntos": [
      [
        0.5,
        0.12
      ],
      [
        0.32,
        0.18
      ],
      [
        0.2,
        0.24
      ],
      [
        0.18,
        0.5
      ],
      [
        0.3,
        0.53
      ],
      [
        0.35,
        0.42
      ],
      [
        0.33,
        0.79
      ],
      [
        0.26,
        0.88
      ],
      [
        0.74,
        0.88
      ],
      [
        0.67,
        0.79
      ],
      [
        0.65,
        0.42
      ],
      [
        0.7,
        0.53
      ],
      [
        0.82,
        0.5
      ],
      [
        0.8,
        0.24
      ],
      [
        0.68,
        0.18
      ],
      [
        0.5,
        0.42
      ],
      [
        0.5,
        0.72
      ],
      [
        0.42,
        0.3
      ],
      [
        0.58,
        0.3
      ]
    ],
    "aristas": [
      [
        0,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        9
      ],
      [
        9,
        10
      ],
      [
        10,
        11
      ],
      [
        11,
        12
      ],
      [
        12,
        13
      ],
      [
        13,
        14
      ],
      [
        14,
        0
      ],
      [
        17,
        15
      ],
      [
        15,
        18
      ],
      [
        15,
        16
      ],
      [
        16,
        7
      ],
      [
        16,
        8
      ]
    ],
    "mensaje": "A veces, la compañía más grande llega caminando sobre cuatro patitas."
  },
  {
    "id": "castillo",
    "nombre": "La fortaleza",
    "puntos": [
      [
        0.12,
        0.88
      ],
      [
        0.12,
        0.32
      ],
      [
        0.2,
        0.32
      ],
      [
        0.2,
        0.22
      ],
      [
        0.28,
        0.22
      ],
      [
        0.28,
        0.32
      ],
      [
        0.38,
        0.32
      ],
      [
        0.38,
        0.1
      ],
      [
        0.47,
        0.1
      ],
      [
        0.47,
        0.2
      ],
      [
        0.53,
        0.2
      ],
      [
        0.53,
        0.1
      ],
      [
        0.62,
        0.1
      ],
      [
        0.62,
        0.32
      ],
      [
        0.72,
        0.32
      ],
      [
        0.72,
        0.22
      ],
      [
        0.8,
        0.22
      ],
      [
        0.8,
        0.32
      ],
      [
        0.88,
        0.32
      ],
      [
        0.88,
        0.88
      ],
      [
        0.43,
        0.88
      ],
      [
        0.43,
        0.66
      ],
      [
        0.57,
        0.66
      ],
      [
        0.57,
        0.88
      ]
    ],
    "aristas": [
      [
        0,
        1
      ],
      [
        1,
        2
      ],
      [
        2,
        3
      ],
      [
        3,
        4
      ],
      [
        4,
        5
      ],
      [
        5,
        6
      ],
      [
        6,
        7
      ],
      [
        7,
        8
      ],
      [
        8,
        9
      ],
      [
        9,
        10
      ],
      [
        10,
        11
      ],
      [
        11,
        12
      ],
      [
        12,
        13
      ],
      [
        13,
        14
      ],
      [
        14,
        15
      ],
      [
        15,
        16
      ],
      [
        16,
        17
      ],
      [
        17,
        18
      ],
      [
        18,
        19
      ],
      [
        19,
        0
      ],
      [
        20,
        21
      ],
      [
        21,
        22
      ],
      [
        22,
        23
      ]
    ],
    "mensaje": "El mejor castillo no nos separa del mundo: nos da un lugar desde el que volver a empezar."
  }
]);

const claveEstelar=(a,b)=>a<b?`${a}-${b}`:`${b}-${a}`;
function normalizarAvanceEstelar(datos){
  const resultado={};
  for(const f of CONSTELACIONES_DESEOS){
    const permitidas=new Set(f.aristas.map(([a,b])=>claveEstelar(a,b)));
    const recibidas=Array.isArray(datos?.[f.id])?datos[f.id]:[];
    resultado[f.id]=new Set(recibidas.filter(k=>typeof k==='string'&&permitidas.has(k)));
  }
  return resultado;
}

function crearObservatorioDeseos(escena,camara,castillo,elemento,opciones={}){
  if(castillo.userData.observatorioDeseos)return castillo.userData.observatorioDeseos;
  const ROOM='Dormitorio oeste',raiz=new THREE.Group();raiz.name='Observatorio de los deseos';castillo.add(raiz);
  const geometrias=new Set(),materiales=new Set(),texturas=new Set(),propios=[],ocultos=[],retirados=[];
  const colisiones=castillo.userData.colisiones,geoCaja=new THREE.BoxGeometry(1,1,1);geometrias.add(geoCaja);
  const marcar=o=>{Object.assign(o.userData,{habitacion:ROOM,noAgrupar:true,dinamico:true});return o;};marcar(raiz);
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});materiales.add(m);return m;}
  const azul=material('#172c4a'),oro=material('#c5a365',{metalness:.6,roughness:.36}),nogal=material('#352a2b'),crema=material('#d9c8a1');
  function caja(nombre,x,y,z,w,h,d,mat,padre=raiz,solido=false){
    const o=marcar(new THREE.Mesh(geoCaja,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;padre.add(o);
    if(solido&&Array.isArray(colisiones)){const r={mesh:o,w,h,d,esCaja:true};colisiones.push(r);propios.push(r);}return o;
  }
  function esfera(nombre,x,y,z,r,mat,padre=raiz){const g=new THREE.SphereGeometry(r,24,18);geometrias.add(g);const o=marcar(new THREE.Mesh(g,mat));o.name=nombre;o.position.set(x,y,z);padre.add(o);return o;}
  function cilindroEntre(a,b,r,mat,padre=raiz){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),dir=vb.clone().sub(va);const g=new THREE.CylinderGeometry(r,r,dir.length(),14);geometrias.add(g);const o=marcar(new THREE.Mesh(g,mat));o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function tex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;texturas.add(t);return t;}
  function plano(c,w,h,x,y,z,rotX=0){const g=new THREE.PlaneGeometry(w,h);geometrias.add(g);const m=new THREE.MeshBasicMaterial({map:tex(c),toneMapped:false});materiales.add(m);const o=marcar(new THREE.Mesh(g,m));o.position.set(x,y,z);o.rotation.x=rotX;raiz.add(o);return o;}
  const zona=new THREE.Box3(new THREE.Vector3(-19.7,9.99,-1.65),new THREE.Vector3(-7.35,16.95,17.7));
  castillo.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),bb=new THREE.Box3();
  castillo.traverse(o=>{if(!o.isMesh||!/^(Cama|Cabecera)(\s|$)/i.test(o.name))return;bb.setFromObject(o).applyMatrix4(inv);if(zona.containsBox(bb))ocultos.push({objeto:o,visible:o.visible});});
  ocultos.forEach(r=>r.objeto.visible=false);
  if(Array.isArray(colisiones)){const quitar=new Set(ocultos.map(r=>r.objeto));for(let i=colisiones.length-1;i>=0;i--)if(quitar.has(colisiones[i].mesh))retirados.push({indice:i,valor:colisiones.splice(i,1)[0]});}
  caja('Observatorio · Muro oeste',-19.585,13.5,8,.018,6.96,19.2,azul);
  caja('Observatorio · Muro frontal',-13.5,13.5,17.585,12.25,6.96,.018,azul);
  caja('Observatorio · Muro posterior',-13.5,13.5,-1.685,12.25,6.96,.018,azul);
  caja('Observatorio · Muro este sur',-7.335,13.5,2.6,.018,6.96,8.14,azul);
  caja('Observatorio · Muro este norte',-7.335,13.5,13.4,.018,6.96,8.14,azul);
  caja('Observatorio · Dintel',-7.335,15.3,8,.018,3.36,2.66,azul);
  caja('Observatorio · Suelo',-13.5,10.05,8,12.22,.012,19.15,nogal);
  for(const z of [-1.55,17.47]){caja('Observatorio · Cornisa',-13.5,16.34,z,12.1,.12,.12,oro);caja('Observatorio · Zócalo',-13.5,10.3,z,12.1,.4,.14,oro);}
  caja('Observatorio · Cornisa oeste',-19.47,16.34,8,.12,.12,19.0,oro);
  const techo=canvas(768,1024),tc=techo.getContext('2d');const grad=tc.createRadialGradient(380,470,20,380,470,700);grad.addColorStop(0,'#294469');grad.addColorStop(.5,'#172a48');grad.addColorStop(1,'#080f23');tc.fillStyle=grad;tc.fillRect(0,0,768,1024);
  let semilla=7062;const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  for(let i=0;i<420;i++){const x=azar()*768,y=azar()*1024,r=.5+azar()*2.0;tc.fillStyle=i%4?'#e6e9ef':'#efd498';tc.globalAlpha=.3+azar()*.7;tc.beginPath();tc.arc(x,y,r,0,Math.PI*2);tc.fill();if(i%29===0){tc.fillRect(x-r*3,y-.5,r*6,1);tc.fillRect(x-.5,y-r*3,1,r*6);}}
  tc.globalAlpha=1;tc.strokeStyle='#b69a6166';tc.lineWidth=2;tc.strokeRect(22,22,724,980);
  const cielo=plano(techo,12.15,19.15,-13.5,16.55,8,Math.PI/2);
  const alf=canvas(512,512),ac=alf.getContext('2d');ac.fillStyle='#203e5a';ac.fillRect(0,0,512,512);ac.strokeStyle='#bfa16a';ac.lineWidth=4;ac.strokeRect(12,12,488,488);ac.strokeRect(27,27,458,458);ac.beginPath();ac.arc(256,256,160,0,Math.PI*2);ac.stroke();
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ac.beginPath();ac.moveTo(256+Math.cos(a)*143,256+Math.sin(a)*143);ac.lineTo(256+Math.cos(a)*158,256+Math.sin(a)*158);ac.stroke();}
  const alfombra=plano(alf,7.0,9.0,-13.4,10.071,8,-Math.PI/2);
  caja('Observatorio · Banco',-13.4,10.6,15.6,4.0,.7,1.2,azul,raiz,true);
  for(const x of [-15,-11.8])for(const z of [15.2,16])caja('Observatorio · Pata del banco',x,10.3,z,.13,.45,.13,oro);
  const rotulo=canvas(1024,220),rc=rotulo.getContext('2d');rc.fillStyle='#14273e';rc.fillRect(0,0,1024,220);rc.strokeStyle='#bfa16a';rc.lineWidth=4;rc.strokeRect(10,10,1004,200);rc.fillStyle='#f2dfb4';rc.font='45px Georgia';rc.textAlign='center';rc.fillText('OBSERVATORIO DE LOS DESEOS',512,100);rc.font='23px Georgia';rc.fillText('Cuatro figuras · Un cielo para compartir',512,157);plano(rotulo,6.9,1.3,-13.5,15.2,-1.56);
  // Telescopio orientado hacia la ventana occidental.
  for(const a of [0,Math.PI*2/3,Math.PI*4/3])cilindroEntre([-17.8,11.8,11.9],[-17.8+Math.cos(a)*.8,10.08,11.9+Math.sin(a)*.8],.055,oro);
  cilindroEntre([-17.8,11.6,11.9],[-17.8,12.2,11.9],.10,nogal);
  cilindroEntre([-17.45,12.10,11.75],[-18.85,12.97,12.0],.205,azul);
  cilindroEntre([-18.72,12.89,11.98],[-18.94,13.03,12.02],.23,oro);
  cilindroEntre([-17.28,11.99,11.72],[-17.53,12.15,11.77],.10,oro);
  const lente=material('#79b9db',{metalness:.15,roughness:.16,emissive:'#244562',emissiveIntensity:.65});esfera('Observatorio · Lente',-18.96,13.04,12.02,.19,lente).scale.set(.17,1,1);
  const invisible=material('#ffffff');invisible.visible=false;
  const proxyTel=caja('Observatorio · Colisión del trípode',-17.8,10.9,11.9,1.5,1.65,1.5,invisible,raiz,true);proxyTel.castShadow=proxyTel.receiveShadow=false;
  // Globo celeste con meridianos, paralelos y estrellas seleccionables.
  caja('Observatorio · Pedestal celeste',-10.3,10.68,2.1,1.45,1.24,1.45,nogal,raiz,true);
  caja('Observatorio · Borde del pedestal',-10.3,11.35,2.1,1.65,.12,1.65,oro);
  const baseGlobo=new THREE.Group();baseGlobo.position.set(-10.3,12.5,2.1);raiz.add(baseGlobo);
  const globo=new THREE.Group();globo.name='Observatorio · Globo giratorio';baseGlobo.add(globo);
  const esferaGlobo=esfera('Observatorio · Esfera celeste',0,0,0,1,material('#102f48',{roughness:.45,metalness:.2}),globo);esferaGlobo.userData.esferaCentral=true;
  const anillos=material('#a48b54',{metalness:.55,roughness:.5});
  for(const lat of [-Math.PI/3,-Math.PI/6,0,Math.PI/6,Math.PI/3]){const g=new THREE.TorusGeometry(Math.cos(lat)*1.008,.008,5,56);geometrias.add(g);const o=marcar(new THREE.Mesh(g,anillos));o.position.y=Math.sin(lat);o.rotation.x=Math.PI/2;globo.add(o);}
  for(let i=0;i<6;i++){const g=new THREE.TorusGeometry(1.008,.007,5,64);geometrias.add(g);const o=marcar(new THREE.Mesh(g,anillos));o.rotation.y=i*Math.PI/6;globo.add(o);}
  const brilloCanvas=canvas(64,64),bc=brilloCanvas.getContext('2d');const bg=bc.createRadialGradient(32,32,0,32,32,31);bg.addColorStop(0,'rgba(255,255,255,1)');bg.addColorStop(.15,'rgba(255,247,211,1)');bg.addColorStop(.4,'rgba(255,220,145,.3)');bg.addColorStop(1,'rgba(255,255,255,0)');bc.fillStyle=bg;bc.fillRect(0,0,64,64);const brilloTex=tex(brilloCanvas);
  const materialesFiguras=new Map();
  CONSTELACIONES_DESEOS.forEach((f,indice)=>{
    const posiciones=f.puntos.map(([x,y])=>{const lon=indice*Math.PI/2+(x-.5)*.96,lat=(.5-y)*1.0;return new THREE.Vector3(Math.sin(lon)*Math.cos(lat),Math.sin(lat),Math.cos(lon)*Math.cos(lat)).multiplyScalar(1.025);});
    const g=new THREE.BufferGeometry().setFromPoints(posiciones);geometrias.add(g);const m=new THREE.PointsMaterial({map:brilloTex,color:'#dde9ff',size:.095,transparent:true,depthWrite:false,alphaTest:.01,toneMapped:false});materiales.add(m);
    const o=new THREE.Points(g,m);o.name='Estrellas · '+f.nombre;o.userData.figuraId=f.id;globo.add(o);
    const segmentos=[];
    for(const [a,b] of f.aristas)for(let j=0;j<8;j++){for(const t of [j/8,(j+1)/8]){const v=posiciones[a].clone().lerp(posiciones[b],t).normalize().multiplyScalar(1.022);segmentos.push(v.x,v.y,v.z);}}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(segmentos,3));geometrias.add(lg);
    const lm=new THREE.LineBasicMaterial({color:'#8299ae',transparent:true,opacity:.20,toneMapped:false});materiales.add(lm);globo.add(new THREE.LineSegments(lg,lm));materialesFiguras.set(f.id,{puntos:m,lineas:lm});
  });
  const luz=new THREE.PointLight(0xffddaa,24,13,2);luz.position.set(-13.5,14.8,8);luz.castShadow=false;raiz.add(luz);marcar(luz);
  // Progreso propio y validado. No utiliza datos de las otras habitaciones.
  const claveGuardado='castillo-observatorio-deseos:v1:'+new URL('./',document.baseURI).pathname;
  let guardadoDisponible=true,bruto=null;
  try{const entrada=localStorage.getItem(claveGuardado);if(entrada){const d=JSON.parse(entrada);if(d?.version===1)bruto=d.avances;}}catch{guardadoDisponible=false;}
  let avances=normalizarAvanceEstelar(bruto);
  const terminada=f=>avances[f.id].size===f.aristas.length;
  const todas=()=>CONSTELACIONES_DESEOS.every(terminada);
  function guardar(){try{localStorage.setItem(claveGuardado,JSON.stringify({version:1,avances:Object.fromEntries(CONSTELACIONES_DESEOS.map(f=>[f.id,[...avances[f.id]]]))}));guardadoDisponible=true;}catch{guardadoDisponible=false;}}
  // Un castillo realmente tridimensional construido con líneas y partículas.
  const palacio=new THREE.Group();palacio.name='Observatorio · Castillo de estrellas';palacio.position.set(-13.4,14.2,8);raiz.add(palacio);
  const segmentosCastillo=[];
  function arista(a,b){segmentosCastillo.push(...a,...b);}
  function cajaAlambre(cx,cy,cz,w,h,d){const v=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])v.push([cx+x*w/2,cy+y*h/2,cz+z*d/2]);for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if([0,1,2].filter(k=>v[i][k]!==v[j][k]).length===1)arista(v[i],v[j]);}
  cajaAlambre(0,-.5,0,2.9,.8,1.5);
  for(const x of [-1.65,1.65])for(const z of [-.8,.8]){
    cajaAlambre(x,-.02,z,.65,1.8,.65);
    const base=[[x-.42,.88,z-.42],[x+.42,.88,z-.42],[x+.42,.88,z+.42],[x-.42,.88,z+.42]],punta=[x,1.52,z];
    for(let i=0;i<4;i++){arista(base[i],base[(i+1)%4]);arista(base[i],punta);}
  }
  cajaAlambre(0,.2,0,.82,1.9,.82);
  for(const x of [-.49,.49])for(const z of [-.49,.49])arista([x,1.15,z],[0,1.83,0]);
  arista([-.32,-.9,.765],[-.32,-.35,.765]);arista([.32,-.9,.765],[.32,-.35,.765]);
  for(let i=0;i<10;i++){const a=Math.PI-i*Math.PI/10,b=Math.PI-(i+1)*Math.PI/10;arista([Math.cos(a)*.32,-.35+Math.sin(a)*.32,.765],[Math.cos(b)*.32,-.35+Math.sin(b)*.32,.765]);}
  const destino=[];
  for(let i=0;i<segmentosCastillo.length;i+=6){const a=new THREE.Vector3(...segmentosCastillo.slice(i,i+3)),b=new THREE.Vector3(...segmentosCastillo.slice(i+3,i+6)),n=Math.max(2,Math.ceil(a.distanceTo(b)/.11));for(let j=0;j<=n;j++){const v=a.clone().lerp(b,j/n);destino.push(v.x,v.y,v.z);}}
  const destinos=new Float32Array(destino),origenes=new Float32Array(destinos.length);
  for(let i=0;i<origenes.length;i+=3){origenes[i]=(azar()-.5)*10.6;origenes[i+1]=1.8+azar()*.45;origenes[i+2]=(azar()-.5)*17.0;}
  const estrellasGeo=new THREE.BufferGeometry();estrellasGeo.setAttribute('position',new THREE.BufferAttribute(origenes.slice(),3));geometrias.add(estrellasGeo);
  const estrellasMat=new THREE.PointsMaterial({map:brilloTex,color:'#ffe4a4',size:.095,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(estrellasMat);
  const estrellas=new THREE.Points(estrellasGeo,estrellasMat);estrellas.frustumCulled=false;palacio.add(estrellas);
  const wireGeo=new THREE.BufferGeometry();wireGeo.setAttribute('position',new THREE.Float32BufferAttribute(segmentosCastillo,3));geometrias.add(wireGeo);
  const wireMat=new THREE.LineBasicMaterial({color:'#ffe1a0',transparent:true,opacity:0,toneMapped:false});materiales.add(wireMat);palacio.add(new THREE.LineSegments(wireGeo,wireMat));
  const estrellaMat=new THREE.SpriteMaterial({map:brilloTex,color:'#ffe7a4',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(estrellaMat);
  const estrellaRecuerdo=new THREE.Sprite(estrellaMat);estrellaRecuerdo.position.set(0,1.88,0);estrellaRecuerdo.scale.set(.8,.8,1);palacio.add(estrellaRecuerdo);
  let morph=todas()?1:0;estrellaMat.opacity=todas()?1:0;
  function colocarCastillo(p){const a=estrellasGeo.attributes.position.array;const s=p*p*(3-2*p);for(let i=0;i<a.length;i++)a[i]=origenes[i]+(destinos[i]-origenes[i])*s;estrellasGeo.attributes.position.needsUpdate=true;wireMat.opacity=Math.max(0,(p-.65)/.35)*.7;estrellaMat.opacity=Math.max(0,(p-.9)/.1);}
  colocarCastillo(morph);

  // Interfaz del telescopio y del globo. Las figuras son imaginarias, no cartas astronómicas.
  const id='observatorio-deseos',estilo=document.createElement('style');estilo.textContent=`
  #${id}[hidden],#${id} [hidden],#${id}-acciones[hidden],#${id}-acciones button[hidden]{display:none!important}
  #${id},#${id}-acciones{font:14px/1.5 system-ui,sans-serif;color:#f3e9d4;box-sizing:border-box}
  #${id}{position:fixed;inset:0;z-index:32000;background:#070f20ef;display:grid;place-items:center;padding:14px;overscroll-behavior:contain}
  #${id}.od-final{display:flex;align-items:flex-end;justify-content:center;background:transparent}
  #${id} *{box-sizing:border-box}
  #${id} .od-caja{position:relative;width:min(1000px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:22px;background:linear-gradient(135deg,#162c48,#0d172d);border:1px solid #b99b61;border-radius:18px;box-shadow:0 20px 75px #0007}
  #${id}.od-final .od-caja{width:min(760px,100%);background:#10233aeb}
  #${id} h2{font:clamp(22px,3.5vw,32px) Georgia,serif;color:#f3dca8;margin:0 70px 7px 0}
  #${id} p{margin:8px 0}
  #${id} .od-intro,#${id} .od-progreso{font-size:13px;color:#c5c6cc}
  #${id} .od-cerrar{position:absolute;right:12px;top:12px}
  #${id} button,#${id}-acciones button{min-height:44px;padding:10px 14px;border:1px solid #aa925e;border-radius:9px;background:#233d59;color:#f3e9d4;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
  #${id} button:hover,#${id}-acciones button:hover{background:#3b5774}
  #${id} button[aria-pressed=true]{background:#6c5735;border-color:#f0d493}
  #${id} button:disabled{opacity:.45;cursor:not-allowed}
  #${id} :focus-visible,#${id}-acciones :focus-visible{outline:3px solid #ffdc8b;outline-offset:3px}
  #${id} .od-filas{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
  #${id} .od-svg{display:block;width:100%;max-height:54dvh;background:radial-gradient(ellipse at center,#1b3556,#071327);border:1px solid #576781;border-radius:12px;touch-action:none;user-select:none}
  #${id} .od-nodo{cursor:pointer;outline:none}
  #${id} .od-nodo:focus .od-aro{stroke:#fff4cf;stroke-width:4;opacity:1}
  #${id} .od-estado{min-height:2em;color:#edd7aa;white-space:pre-line}
  #${id} .od-globo-vista{width:100%;height:clamp(240px,50vh,430px);border:1px solid #566580;border-radius:12px;overflow:hidden;background:#091627}
  #${id} .od-globo-vista canvas{display:block;width:100%;height:100%;touch-action:none}
  #${id} select{min-height:44px;padding:8px;border:1px solid #aa925e;background:#172f49;color:#f3e9d4;border-radius:8px;font:14px system-ui}
  #${id} .od-nota{font-size:12px;color:#acb2c0;margin-top:12px}
  #${id}-acciones{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:27;display:flex;justify-content:center;gap:9px;flex-wrap:wrap;width:max-content;max-width:92vw}
  #${id}-acciones button{background:#122b45ef;box-shadow:0 5px 25px #0008}
  @media(max-width:600px){#${id}{padding:6px}#${id} .od-caja{padding:18px 11px;max-height:calc(100dvh - 12px)}#${id} button{padding:10px;font-size:12px}#${id} .od-svg{max-height:46dvh}#${id} .od-intro{font-size:12px}}
  `;document.head.appendChild(estilo);
  const panel=document.createElement('section');panel.id=id;panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby',id+'-titulo');
  panel.innerHTML=`<div class="od-caja"><button type="button" class="od-cerrar">Cerrar</button><h2 id="${id}-titulo">Observatorio de los deseos</h2><p class="od-progreso" role="status" aria-live="polite"></p><div class="od-normal"><div class="od-filas"><button type="button" data-modo="telescopio">Telescopio</button><button type="button" data-modo="globo">Globo celeste</button></div><div class="od-figuras od-filas"></div><div class="od-telescopio"><p class="od-intro">Selecciona dos estrellas para unirlas. También puedes arrastrar de una a otra. Descubre los enlaces de la figura; un intento incorrecto no borra tu avance.</p><svg class="od-svg" viewBox="0 0 1000 640" role="group" aria-label="Estrellas de la constelación"></svg><div class="od-filas"><label>Estrella <select class="od-estrella" aria-label="Elegir estrella por número"></select></label><button type="button" class="od-elegir">Seleccionar estrella</button></div><div class="od-filas"><button type="button" class="od-pista">Mostrar un enlace pendiente</button></div></div><div class="od-globo" hidden><p class="od-intro">Arrastra para girar el globo y toca una estrella. También puedes usar las flechas del teclado o los botones de las figuras.</p><div class="od-globo-vista"></div><p class="od-seleccion" role="status" aria-live="polite">Selecciona una estrella del globo.</p><button type="button" class="od-trazar">Trazar esta figura</button></div></div><p class="od-estado" role="status" aria-live="polite"></p><div class="od-filas"><button type="button" class="od-ver-final">Ver castillo luminoso</button><button type="button" class="od-volver" hidden>Volver al telescopio</button><button type="button" class="od-reiniciar">Reiniciar este observatorio</button></div><p class="od-nota">Constelaciones imaginarias creadas para este castillo. El progreso se guarda solo en este navegador; no se sincroniza entre dispositivos.</p></div>`;
  document.body.appendChild(panel);
  const acciones=document.createElement('div');acciones.id=id+'-acciones';acciones.hidden=true;acciones.innerHTML='<button type="button" class="od-interactuar">R · Mirar por el telescopio</button><button type="button" class="od-recuerdo" hidden>Ver castillo luminoso</button>';document.body.appendChild(acciones);
  const svg=panel.querySelector('svg'),titulo=panel.querySelector('h2'),progreso=panel.querySelector('.od-progreso'),estado=panel.querySelector('.od-estado'),figurasDiv=panel.querySelector('.od-figuras');
  const cerrarBtn=panel.querySelector('.od-cerrar'),interactuarBtn=acciones.querySelector('.od-interactuar'),recuerdoBtn=acciones.querySelector('.od-recuerdo'),finalBtn=panel.querySelector('.od-ver-final'),volverBtn=panel.querySelector('.od-volver');
  const menu=document.getElementById('menu'),reducido=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let controles=null,oclusion=null,liberado=false,abierto=false,modo='telescopio',indice=0,seleccionada=null,pista=null,nota='';
  let dentro=false,cercaTel=false,cercaGlobo=false,reloj=0,finalTiempo=-1,recuerdoCamara=null,destinoCamara=null;
  let rendererGlobo=null,escenaGlobo=null,camaraGlobo=null,miniGlobo=null,esferaMini=null,halo=null,ro=null;
  const estrellasMini=[],localCam=new THREE.Vector3(),raycaster=new THREE.Raycaster(),puntero=new THREE.Vector2();
  let arrastre=null,arrastreSVG=null,ignorarClic=false;
  CONSTELACIONES_DESEOS.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.dataset.figura=String(i);b.addEventListener('click',()=>{indice=i;seleccionada=null;pista=null;nota='';if(modo==='globo'){panel.querySelector('.od-seleccion').textContent=`${f.nombre}: seleccionada con el botón. Puedes buscar sus estrellas girando el globo.`;}interfaz();});figurasDiv.appendChild(b);});
  function actualizarMateriales(){for(const f of CONSTELACIONES_DESEOS){const m=materialesFiguras.get(f.id);m.puntos.color.set(terminada(f)?'#ffdd89':'#dfecff');m.lineas.color.set(terminada(f)?'#efca7a':'#8299ae');m.lineas.opacity=terminada(f) ? .85:.20;}}
  function dibujarSVG(){
    const f=CONSTELACIONES_DESEOS[indice],hechas=avances[f.id];const foco=document.activeElement?.getAttribute?.('data-estrella');
    const pos=n=>[80+f.puntos[n][0]*840,45+f.puntos[n][1]*530];
    let fondo='';for(let i=0;i<55;i++){const x=30+(i*137%940),y=20+(i*83%580);fondo+=`<circle cx="${x}" cy="${y}" r="${i%4===0?1.7:.9}" fill="#d5e1f5" opacity=".35"/>`;}
    let lineas='';for(const [a,b] of f.aristas){const clave=claveEstelar(a,b);if(!hechas.has(clave)&&pista!==clave)continue;const [x1,y1]=pos(a),[x2,y2]=pos(b);lineas+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hechas.has(clave)?'#f4d791':'#9bbbd7'}" stroke-width="${hechas.has(clave)?4:3}" ${hechas.has(clave)?'':'stroke-dasharray="10 9"'} opacity=".9"/>`;}
    const nodos=f.puntos.map((_,n)=>{const [x,y]=pos(n),sel=n===seleccionada;return `<g class="od-nodo" data-estrella="${n}" role="button" tabindex="0" aria-label="Estrella ${n+1} de ${f.nombre}${sel?', seleccionada':''}" aria-pressed="${sel}"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle class="od-aro" cx="${x}" cy="${y}" r="17" fill="none" stroke="#edce88" stroke-width="2" opacity="${sel?1:.15}"/><circle cx="${x}" cy="${y}" r="10" fill="#dce9ff" opacity=".14"/><circle cx="${x}" cy="${y}" r="5.7" fill="${sel?'#ffe1a0':'#f4f7ff'}"/><text x="${x+14}" y="${y-13}" fill="#bbc9de" font-size="16" font-family="system-ui" pointer-events="none">${n+1}</text></g>`;}).join('');
    svg.innerHTML=fondo+lineas+nodos;svg.setAttribute('aria-label',`${f.nombre}: ${hechas.size} de ${f.aristas.length} enlaces`);
    const selector=panel.querySelector('.od-estrella');if(selector.dataset.figura!==f.id){selector.innerHTML=f.puntos.map((_,n)=>`<option value="${n}">${n+1}</option>`).join('');selector.dataset.figura=f.id;}
    if(foco!==null&&foco!==undefined)svg.querySelector(`[data-estrella="${foco}"]`)?.focus();
  }
  function interfaz(){
    if(liberado)return;const esFinal=modo==='final',f=CONSTELACIONES_DESEOS[indice],completadas=CONSTELACIONES_DESEOS.filter(terminada).length;
    panel.classList.toggle('od-final',esFinal);panel.querySelector('.od-normal').hidden=esFinal;panel.querySelector('.od-telescopio').hidden=modo!=='telescopio';panel.querySelector('.od-globo').hidden=modo!=='globo';
    titulo.textContent=esFinal?'El castillo de los deseos':modo==='globo'?'Globo celeste':`Telescopio · ${f.nombre}`;
    progreso.textContent=`${completadas} de 4 constelaciones completas${guardadoDisponible?' · Progreso local':' · No se pudo guardar: progreso solo de esta sesión'}`;
    panel.querySelectorAll('[data-modo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modo===modo)));
    figurasDiv.querySelectorAll('button').forEach((b,i)=>{const c=CONSTELACIONES_DESEOS[i];b.textContent=c.nombre+(terminada(c)?' · Completa':'');b.setAttribute('aria-pressed',String(i===indice));});
    finalBtn.disabled=!todas();finalBtn.hidden=esFinal;volverBtn.hidden=!esFinal;recuerdoBtn.hidden=!todas();panel.querySelector('.od-reiniciar').hidden=esFinal;
    estado.textContent=esFinal?'Las luces que reuniste están construyendo un refugio entre las estrellas.\nLa estrella de la torre quedará encendida como recuerdo.':nota||(terminada(f)?f.mensaje:`${avances[f.id].size} de ${f.aristas.length} enlaces · Elige dos estrellas para comenzar.`);
    if(modo==='telescopio')dibujarSVG();if(modo==='globo')prepararGlobo();actualizarMateriales();
  }
  function seleccionarEstrella(n){
    const f=CONSTELACIONES_DESEOS[indice];if(!Number.isInteger(n)||n<0||n>=f.puntos.length||terminada(f))return;
    if(seleccionada===null){seleccionada=n;nota=`Estrella ${n+1} seleccionada. Elige otra para unirlas.`;interfaz();return;}
    if(seleccionada===n){seleccionada=null;nota='Selección cancelada.';interfaz();return;}
    const clave=claveEstelar(seleccionada,n),permitida=f.aristas.some(([a,b])=>claveEstelar(a,b)===clave);
    if(permitida){
      if(avances[f.id].has(clave))nota='Ese enlace ya está trazado. Puedes continuar desde esta estrella.';
      else{avances[f.id].add(clave);pista=null;guardar();nota='Bien: un nuevo hilo de luz.';}
      seleccionada=n;
      if(terminada(f)){seleccionada=null;nota=f.mensaje;guardar();if(todas()){interfaz();empezarFinal();return;}}
    }else{seleccionada=n;nota='Esas dos estrellas no forman un enlace de esta figura. No perdiste tu avance. Puedes pedir una pista.';}
    interfaz();
  }
  svg.addEventListener('click',e=>{if(ignorarClic){ignorarClic=false;return;}const n=e.target.closest?.('[data-estrella]');if(n)seleccionarEstrella(Number(n.dataset.estrella));});
  svg.addEventListener('keydown',e=>{const n=e.target.closest?.('[data-estrella]');if(n&&(e.key==='Enter'||e.key===' ')){e.preventDefault();seleccionarEstrella(Number(n.dataset.estrella));}});
  svg.addEventListener('pointerdown',e=>{const n=e.target.closest?.('[data-estrella]');arrastreSVG=n?{n:Number(n.dataset.estrella),x:e.clientX,y:e.clientY}:null;});
  svg.addEventListener('pointerup',e=>{if(!arrastreSVG)return;const origen=arrastreSVG;arrastreSVG=null;const objetivo=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-estrella]');if(objetivo&&svg.contains(objetivo)&&Number(objetivo.dataset.estrella)!==origen.n&&Math.hypot(e.clientX-origen.x,e.clientY-origen.y)>6){seleccionada=origen.n;seleccionarEstrella(Number(objetivo.dataset.estrella));ignorarClic=true;setTimeout(()=>{ignorarClic=false;},0);}});
  svg.addEventListener('pointercancel',()=>{arrastreSVG=null;});
  panel.querySelector('.od-elegir').addEventListener('click',()=>seleccionarEstrella(Number(panel.querySelector('.od-estrella').value)));
  panel.querySelector('.od-pista').addEventListener('click',()=>{const f=CONSTELACIONES_DESEOS[indice],arista=f.aristas.find(([a,b])=>!avances[f.id].has(claveEstelar(a,b)));pista=arista?claveEstelar(...arista):null;nota=arista?`Prueba a unir las estrellas ${arista[0]+1} y ${arista[1]+1}.`:f.mensaje;interfaz();});
  // Segundo visor WebGL solo para manipular el globo; se crea al abrirlo por primera vez.
  function redimensionarGlobo(){if(!rendererGlobo)return;const div=panel.querySelector('.od-globo-vista'),w=Math.floor(div.clientWidth),h=Math.floor(div.clientHeight);if(w<1||h<1)return;rendererGlobo.setSize(w,h,false);camaraGlobo.aspect=w/h;camaraGlobo.updateProjectionMatrix();}
  function prepararGlobo(){
    if(rendererGlobo){redimensionarGlobo();return;}
    try{
      rendererGlobo=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});rendererGlobo.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));rendererGlobo.outputColorSpace=THREE.SRGBColorSpace;
      escenaGlobo=new THREE.Scene();escenaGlobo.background=new THREE.Color('#081426');camaraGlobo=new THREE.PerspectiveCamera(40,1,.1,30);camaraGlobo.position.set(0,.15,3.65);camaraGlobo.lookAt(0,0,0);
      escenaGlobo.add(new THREE.HemisphereLight(0xe0eeff,0x263347,2));const l=new THREE.DirectionalLight(0xffdf9e,2.4);l.position.set(3,4,5);escenaGlobo.add(l);
      estrellasMini.length=0;miniGlobo=globo.clone(true);miniGlobo.rotation.set(.12,globo.rotation.y,0);escenaGlobo.add(miniGlobo);miniGlobo.traverse(o=>{if(o.userData.figuraId)estrellasMini.push(o);if(o.userData.esferaCentral)esferaMini=o;});
      const hg=new THREE.SphereGeometry(.055,12,8);geometrias.add(hg);const hm=new THREE.MeshBasicMaterial({color:'#ffe18e',toneMapped:false});materiales.add(hm);halo=new THREE.Mesh(hg,hm);halo.visible=false;miniGlobo.add(halo);
      const c=rendererGlobo.domElement;c.tabIndex=0;c.setAttribute('role','img');c.setAttribute('aria-label','Globo celeste 3D. Arrastra o usa las flechas para girar; toca una estrella para seleccionarla.');panel.querySelector('.od-globo-vista').appendChild(c);
      c.addEventListener('pointerdown',e=>{e.preventDefault();c.focus();arrastre={id:e.pointerId,x:e.clientX,y:e.clientY,ultimoX:e.clientX,ultimoY:e.clientY,movido:false};c.setPointerCapture(e.pointerId);});
      c.addEventListener('pointermove',e=>{if(!arrastre||arrastre.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-arrastre.ultimoX,dy=e.clientY-arrastre.ultimoY;miniGlobo.rotation.y+=dx*.008;miniGlobo.rotation.x=THREE.MathUtils.clamp(miniGlobo.rotation.x+dy*.008,-1.15,1.15);arrastre.movido ||=Math.hypot(e.clientX-arrastre.x,e.clientY-arrastre.y)>6;arrastre.ultimoX=e.clientX;arrastre.ultimoY=e.clientY;});
      c.addEventListener('pointerup',e=>{if(!arrastre||arrastre.id!==e.pointerId)return;const clic=!arrastre.movido;arrastre=null;if(c.hasPointerCapture(e.pointerId))c.releasePointerCapture(e.pointerId);if(clic)elegirEnGlobo(e);});
      c.addEventListener('pointercancel',()=>{arrastre=null;});
      c.addEventListener('wheel',e=>{e.preventDefault();camaraGlobo.position.z=THREE.MathUtils.clamp(camaraGlobo.position.z+e.deltaY*.002,2.6,5.2);},{passive:false});
      if(typeof ResizeObserver!=='undefined'){ro=new ResizeObserver(redimensionarGlobo);ro.observe(panel.querySelector('.od-globo-vista'));}redimensionarGlobo();
    }catch(e){if(rendererGlobo){rendererGlobo.dispose();rendererGlobo.domElement.remove();rendererGlobo.forceContextLoss?.();rendererGlobo=null;}panel.querySelector('.od-seleccion').textContent='No se pudo abrir este visor 3D. Puedes seleccionar una figura con los botones y trazarla en el telescopio.';}
  }
  function elegirEnGlobo(e){
    const r=rendererGlobo.domElement.getBoundingClientRect();puntero.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);miniGlobo.updateMatrixWorld(true);camaraGlobo.updateMatrixWorld(true);raycaster.params.Points.threshold=.09;raycaster.setFromCamera(puntero,camaraGlobo);
    const fondo=raycaster.intersectObject(esferaMini,false)[0],candidatas=raycaster.intersectObjects(estrellasMini,false);const hit=candidatas.find(h=>!fondo||h.distance<=fondo.distance+.16);
    if(!hit){panel.querySelector('.od-seleccion').textContent='No seleccionaste una estrella. Gira el globo e inténtalo otra vez.';return;}
    indice=CONSTELACIONES_DESEOS.findIndex(f=>f.id===hit.object.userData.figuraId);seleccionada=null;pista=null;
    halo.position.fromBufferAttribute(hit.object.geometry.attributes.position,hit.index);halo.visible=true;
    panel.querySelector('.od-seleccion').textContent=`Estrella ${hit.index+1} · ${CONSTELACIONES_DESEOS[indice].nombre}. Puedes trazar esta figura en el telescopio.`;nota='';interfaz();
  }
  function enfocarFinal(){
    const posicion=castillo.localToWorld(new THREE.Vector3(-13.4,11.85,13.2)),objetivo=castillo.localToWorld(new THREE.Vector3(-13.4,14.45,8));
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(posicion,objetivo,camara.up));
    if(camara.parent){camara.parent.updateWorldMatrix(true,false);camara.parent.worldToLocal(posicion);q.premultiply(camara.parent.getWorldQuaternion(new THREE.Quaternion()).invert());}
    return{posicion,quaternion:q};
  }
  function empezarFinal(){
    if(!todas()||liberado||!dentro)return;if(!abierto)abrir('telescopio');
    if(!recuerdoCamara)recuerdoCamara={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};
    destinoCamara=enfocarFinal();modo='final';finalTiempo=0;morph=0;colocarCastillo(0);interfaz();cerrarBtn.focus();
  }
  function restaurarCamara(){if(recuerdoCamara){camara.position.copy(recuerdoCamara.posicion);camara.quaternion.copy(recuerdoCamara.quaternion);recuerdoCamara=null;destinoCamara=null;}}
  function abrir(m='telescopio'){
    if(liberado||!dentro||abierto)return;modo=m==='globo'?'globo':'telescopio';abierto=true;controles?.pausar?.();if(document.pointerLockElement){try{const p=document.exitPointerLock();p?.catch?.(()=>{});}catch{}}
    panel.hidden=false;acciones.hidden=true;if(menu)menu.hidden=true;nota='';interfaz();cerrarBtn.focus();
  }
  function cerrar(){if(!abierto)return;restaurarCamara();abierto=false;panel.hidden=true;if(menu){menu.hidden=false;document.getElementById('boton-iniciar')?.focus();}}
  function alDesbloquear(){if(abierto&&menu)menu.hidden=true;}
  function teclado(e){
    if(abierto){
      if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
      if(e.code==='Tab'){
        const lista=[...panel.querySelectorAll('button,select,[tabindex="0"]')].filter(b=>!b.disabled&&b.getClientRects().length),primero=lista[0],ultimo=lista[lista.length-1];
        if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
      }
      if(modo==='globo'&&miniGlobo&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();miniGlobo.rotation.y+=(e.code==='ArrowLeft'?-.12:e.code==='ArrowRight' ? .12:0);miniGlobo.rotation.x=THREE.MathUtils.clamp(miniGlobo.rotation.x+(e.code==='ArrowUp'?-.10:e.code==='ArrowDown' ? .10:0),-1.15,1.15);return;}
      const nodo=e.target.closest?.('[data-estrella]');
      if(modo==='telescopio'&&nodo&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();const n=Number(nodo.dataset.estrella),longitud=CONSTELACIONES_DESEOS[indice].puntos.length,paso=['ArrowLeft','ArrowUp'].includes(e.code)?-1:1;svg.querySelector(`[data-estrella="${(n+paso+longitud)%longitud}"]`)?.focus();return;}
      if(e.code==='Space'&&nodo){e.preventDefault();e.stopImmediatePropagation();seleccionarEstrella(Number(nodo.dataset.estrella));return;}
      if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','KeyG','Space'].includes(e.code))e.stopImmediatePropagation();return;
    }
    if(e.code!=='KeyR'||e.repeat||!dentro||(!cercaTel&&!cercaGlobo)||Boolean(menu&&!menu.hidden)||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
    e.preventDefault();e.stopImmediatePropagation();abrir(cercaGlobo?'globo':'telescopio');
  }
  cerrarBtn.addEventListener('click',cerrar);interactuarBtn.addEventListener('click',()=>abrir(cercaGlobo?'globo':'telescopio'));recuerdoBtn.addEventListener('click',empezarFinal);finalBtn.addEventListener('click',empezarFinal);
  volverBtn.addEventListener('click',()=>{restaurarCamara();modo='telescopio';nota='';interfaz();});
  panel.querySelectorAll('[data-modo]').forEach(b=>b.addEventListener('click',()=>{modo=b.dataset.modo;nota='';interfaz();}));
  panel.querySelector('.od-trazar').addEventListener('click',()=>{modo='telescopio';seleccionada=null;nota='';interfaz();});
  panel.querySelector('.od-reiniciar').addEventListener('click',()=>{if(!window.confirm('¿Borrar únicamente el progreso de las cuatro constelaciones de este observatorio?'))return;avances=normalizarAvanceEstelar(null);guardar();seleccionada=null;pista=null;morph=0;finalTiempo=-1;palacio.rotation.y=0;colocarCastillo(0);nota='Un cielo nuevo para empezar otra vez.';interfaz();});
  document.addEventListener('keydown',teclado,true);document.addEventListener('pointerlockchange',alDesbloquear);window.addEventListener('resize',redimensionarGlobo);
  const objetivoCercania0=new THREE.Vector3(-17.8,11.9,11.9);
  const objetivoCercania1=new THREE.Vector3(-10.3,12.5,2.1);
  function actualizar(dt=0){
    if(liberado)return;const paso=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));reloj+=paso;
    castillo.updateWorldMatrix(true,false);camara.getWorldPosition(localCam);castillo.worldToLocal(localCam);
    dentro=localCam.x> -19.7&&localCam.x< -7.3&&localCam.z> -1.65&&localCam.z<17.7&&localCam.y>10&&localCam.y<16.95;
    cercaTel=dentro&&localCam.distanceTo(objetivoCercania0)<3.4;cercaGlobo=dentro&&localCam.distanceTo(objetivoCercania1)<3.2;
    const visible=oclusion?.habitaciones?.find(h=>h.id===ROOM)?.visible??true;raiz.visible=visible;luz.visible=visible;
    acciones.hidden=!dentro||abierto||Boolean(menu&&!menu.hidden)||(!cercaTel&&!cercaGlobo&&!todas());interactuarBtn.hidden=!cercaTel&&!cercaGlobo;interactuarBtn.textContent=cercaGlobo?'R · Explorar el globo celeste':'R · Mirar por el telescopio';recuerdoBtn.hidden=!todas();
    if(visible&&!reducido)globo.rotation.y+=paso*.065;
    if(finalTiempo>=0){
      finalTiempo+=paso;morph=Math.min(1,finalTiempo/(reducido ? .05:7.0));colocarCastillo(morph);
      if(modo==='final'&&abierto&&recuerdoCamara&&destinoCamara){const p=Math.min(1,finalTiempo/(reducido ? .05:1.3)),s=p*p*(3-2*p);camara.position.lerpVectors(recuerdoCamara.posicion,destinoCamara.posicion,s);camara.quaternion.slerpQuaternions(recuerdoCamara.quaternion,destinoCamara.quaternion,s);}
      if(morph===1)finalTiempo=-1;
    }
    if(morph===1&&visible){if(!reducido)palacio.rotation.y+=paso*.055;estrellaRecuerdo.scale.setScalar(.8+(reducido?0:Math.sin(reloj*2)*.1));}
    if(abierto&&modo==='globo'&&rendererGlobo){if(!arrastre&&!reducido)miniGlobo.rotation.y+=paso*.045;rendererGlobo.render(escenaGlobo,camaraGlobo);}
    if(abierto&&!dentro&&modo!=='final')cerrar();if(abierto&&menu&&!menu.hidden)menu.hidden=true;
  }
  actualizarMateriales();
  const api={raiz,globo,telescopio:proxyTel,actualizar,abrir,cerrar,verCastillo:empezarFinal,
    vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get completadas(){return CONSTELACIONES_DESEOS.filter(terminada).map(f=>f.id);},get abierto(){return abierto;},get modo(){return modo;},
    liberar(){
      if(liberado)return;cerrar();liberado=true;ro?.disconnect();rendererGlobo?.dispose();rendererGlobo?.forceContextLoss?.();
      document.removeEventListener('keydown',teclado,true);document.removeEventListener('pointerlockchange',alDesbloquear);window.removeEventListener('resize',redimensionarGlobo);
      panel.remove();acciones.remove();estilo.remove();raiz.removeFromParent();
      if(Array.isArray(colisiones)){for(const r of propios){const i=colisiones.indexOf(r);if(i>=0)colisiones.splice(i,1);}retirados.sort((a,b)=>a.indice-b.indice).forEach(r=>colisiones.splice(Math.min(r.indice,colisiones.length),0,r.valor));}
      ocultos.forEach(r=>r.objeto.visible=r.visible);for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();delete castillo.userData.observatorioDeseos;
    }
  };castillo.userData.observatorioDeseos=api;return api;
}

exports.CONSTELACIONES_DESEOS = CONSTELACIONES_DESEOS;
exports.claveEstelar = claveEstelar;
exports.normalizarAvanceEstelar = normalizarAvanceEstelar;
exports.crearObservatorioDeseos = crearObservatorioDeseos;
},
"./decoracionBoticario.js": function(module, exports, __require) {
const THREE = __THREE;


// Decoracion calculada una vez antes de cachear colisiones/fusionar estructura.
function decorarBoticario(castillo, grupo, recursos) {
  if(grupo.userData.decorado)return;
  grupo.userData.decorado=true;
  let semilla=629;
  const azar=()=>{semilla=(Math.imul(1664525,semilla)+1013904223)>>>0;return semilla/4294967296;};
  function textura(tipo){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    if(tipo==='madera'){
      g.fillStyle='#6d5740';g.fillRect(0,0,256,256);
      for(let tabla=0;tabla<4;tabla++){
        const v=Math.floor(azar()*18);g.fillStyle=`rgb(${90+v},${68+v},${44+v})`;g.fillRect(tabla*64+1,0,62,256);
        for(let j=0;j<28;j++){const x=tabla*64+3+azar()*58;g.strokeStyle=`rgba(32,21,10,${.1+azar()*.18})`;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+7,85,x-7,170,x,256);g.stroke();}
      }
    }else{
      g.fillStyle=tipo==='verde'?'#6f8170':'#c4bea3';g.fillRect(0,0,256,256);const image=g.getImageData(0,0,256,256);
      for(let i=0;i<image.data.length;i+=4){const ruido=(azar()-.5)*12;for(let j=0;j<3;j++)image.data[i+j]+=ruido;}g.putImageData(image,0,0);
    }
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;recursos.t.add(t);return t;
  }
  function mat(color,map=null){const m=new THREE.MeshBasicMaterial({color,map,toneMapped:false});recursos.m.add(m);return m;}
  const madera=mat(0xffffff,textura('madera')),verde=mat(0xffffff,textura('verde')),crema=mat(0xffffff,textura('crema'));
  const dorado=mat(0xbba371),hojas=mat(0x68856b),botella=mat(0xffffff),corcho=mat(0x8d7653);
  const originales=grupo.children.filter(o=>o.isMesh&&!o.isInstancedMesh);
  for(const o of originales){
    let material=null;
    if(/Suelo|Mueble herbario|Estante|Balda|Separador/.test(o.name))material=madera;
    else if(/Mural boticario fondo|Entrada boticario/.test(o.name))material=verde;
    else if(/Mural boticario sur|Mural boticario norte|Dintel boticario/.test(o.name))material=crema;
    if(!material||o.geometry.type!=='BoxGeometry')continue;
    if(o.name==='Estante botanico'){
      // Convertir el bloque macizo en un fondo delgado para que se vean los estantes.
      o.position.x=-19.28;o.scale.x=.08;
      for(const c of castillo.userData.colisiones)if(c.mesh===o)c.w=.08;
    }
    const g=o.geometry.clone(),uv=g.attributes.uv,w=o.scale.x,h=o.scale.y,d=o.scale.z;
    const caras=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let i=0;i<uv.count;i++){const[u,v]=caras[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*u/3,uv.getY(i)*v/3);}
    g.clearGroups();recursos.g.add(g);o.geometry=g;o.material=material;
  }
  const cube=new THREE.BoxGeometry(1,1,1),unidad=cube.toNonIndexed();recursos.g.add(cube);
  function lote(nombre,items,material){
    const pos=[],p=new THREE.Vector3(),m=new THREE.Matrix4();
    for(const[x,y,z,w,h,d]of items){m.makeScale(w,h,d);m.setPosition(x,y,z);for(let i=0;i<unidad.attributes.position.count;i++){p.fromBufferAttribute(unidad.attributes.position,i).applyMatrix4(m);pos.push(p.x,p.y,p.z);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeBoundingSphere();recursos.g.add(g);
    const o=new THREE.Mesh(g,material);o.name=nombre;o.userData.habitacion='Armeria';grupo.add(o);
  }
  const molduras=[];
  for(const y of[3.2,4.3,9.48])molduras.push([-19.45,y,-10,.035,.06,15.0],[-13.45,y,-17.5,12,.06,.035],[-13.45,y,-2.5,12,.06,.035]);
  for(const z of[-15.1,-10,-4.9])molduras.push([-18.29,4.9,z,.045,2.8,.045]);
  lote('Molduras boticario mejorado',molduras,dorado);
  lote('Remates estantes boticario',[4.6,5.8,6.35].map(y=>[-18.31,y,-10,.025,.035,10.5]),hojas);unidad.dispose();

  // Frascos ornamentales sin recetas ni identificacion medicinal.
  const posiciones=[];for(const y of[4.86,6.06])for(const z of[-14.4,-12.7,-10.8,-8.7,-6.2])posiciones.push([-18.55,y,z]);
  const cuerpoGeo=new THREE.CylinderGeometry(.13,.15,.34,8),tapaGeo=new THREE.CylinderGeometry(.09,.09,.08,8);recursos.g.add(cuerpoGeo);recursos.g.add(tapaGeo);
  const frascos=new THREE.InstancedMesh(cuerpoGeo,botella,posiciones.length),tapas=new THREE.InstancedMesh(tapaGeo,corcho,posiciones.length),aux=new THREE.Object3D();
  const colores=[0x617c6a,0xa78b58,0x8b9c7c,0x798b8d];
  posiciones.forEach(([x,y,z],i)=>{aux.position.set(x,y,z);aux.updateMatrix();frascos.setMatrixAt(i,aux.matrix);frascos.setColorAt(i,new THREE.Color(colores[i%colores.length]));aux.position.y=y+.21;aux.updateMatrix();tapas.setMatrixAt(i,aux.matrix);});
  for(const o of[frascos,tapas]){o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();o.userData.habitacion='Armeria';grupo.add(o);}
  const liberarAnterior=grupo.userData.liberarDecoracion;
  grupo.userData.liberarDecoracion=()=>{frascos.dispose();tapas.dispose();liberarAnterior?.();};

  // Laminas botanicas genericas, no fotos inventadas de especies de la API.
  for(const [i,x]of[-15.5,-11.6].entries()){
    const c=document.createElement('canvas');c.width=384;c.height=512;const g=c.getContext('2d');g.fillStyle='#d8cfb4';g.fillRect(0,0,384,512);g.strokeStyle='#8c8664';g.lineWidth=3;g.strokeRect(15,15,354,482);
    g.strokeStyle='#47694f';g.lineWidth=6;g.beginPath();g.moveTo(192,430);g.quadraticCurveTo(i?150:230,270,192,95);g.stroke();
    for(let j=0;j<6;j++){const y=140+j*45;g.fillStyle=j%2?'#688063':'#7e916c';g.beginPath();g.ellipse(192+(j%2?37:-37),y,47,17,j%2?-.55:.55,0,Math.PI*2);g.fill();}
    g.fillStyle='#4c5b43';g.textAlign='center';g.font='23px Georgia';g.fillText(i?'APRENDER':'OBSERVAR',192,475);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;recursos.t.add(t);const geo=new THREE.PlaneGeometry(1.9,2.5);recursos.g.add(geo);
    const o=new THREE.Mesh(geo,mat(0xffffff,t));o.name='Lamina botanica decorativa';o.position.set(x,7.3,-2.47);o.rotation.y=Math.PI;o.userData.habitacion='Armeria';grupo.add(o);
  }
}

exports.decorarBoticario = decorarBoticario;
},
"./correccionesCastillo.js": function(module, exports, __require) {
const THREE = __THREE;


// Ejecutar ANTES de crearRenderizadoDinamico y crearOclusionHabitaciones.
function corregirPisosEIluminacion(escena,camara,castillo) {
  const cambios=[];
  const mover=(nombre,fn)=>{castillo.traverse(o=>{if(o.isMesh&&o.name===nombre){fn(o);cambios.push(nombre);}});};
  // El piso sigue a y=3. Solo baja el bloque de soporte que tenia su tapa a y=3.
  mover('Cimentacion continua',o=>{o.position.y=1.35;});
  // Evita que el remate del relleno compita con el piso interior a y=3.
  mover('Remate del zocalo',o=>{o.position.y=2.84;});
  mover('Relleno lateral de acceso',o=>{o.position.y=1.4;});
  // Antes ocupaba z=17..18.6: invadia el piso interior que termina en z=18.
  mover('Descanso entrada',o=>{o.position.z=18.3;o.scale.z=0.6;});
  mover('Descanso de entrada',o=>{o.position.z=18.3;o.scale.z=0.6;});
  // El patio termina en z=44. El umbral nuevo empieza alli y termina en 45.5.
  mover('Umbral de salida',o=>{o.position.z=44.75;o.scale.z=1.5;});
  // El sendero exterior ya empieza en z=45.5, por lo que no hay solape de areas.
  // No modificar materiales compartidos ni desactivar el test/escritura de profundidad.
  castillo.updateMatrixWorld(true);

  // El gestor dinamico copia estos valores al construir su pool de luces.
  let lucesReforzadas=0;
  castillo.traverse(o=>{
    if(!o.isPointLight)return;
    o.intensity=Math.max(o.intensity,110);
    o.distance=Math.max(o.distance,24);
    lucesReforzadas++;
  });
  const relleno=new THREE.AmbientLight(0xffedd6,0);
  relleno.name='Relleno interior controlado';escena.add(relleno);
  const local=new THREE.Vector3(),inversa=new THREE.Matrix4();
  const ajustes={rellenoInterior:0.6,transicion:6};
  function actualizar(dt=0) {
    castillo.updateWorldMatrix(true,false);
    inversa.copy(castillo.matrixWorld).invert();
    camara.getWorldPosition(local).applyMatrix4(inversa);
    const dentro=Math.abs(local.x)<20.4&&local.z>-18.4&&local.z<18.4&&local.y>2.7&&local.y<17.5;
    // Interpolacion, no encendido/apagado brusco al mirar o cruzar una puerta.
    relleno.intensity=THREE.MathUtils.damp(relleno.intensity,dentro?ajustes.rellenoInterior:0,ajustes.transicion,dt);
  }
  return {actualizar,ajustes,informe:{geometriasCorregidas:cambios,lucesReforzadas},
    liberar(){escena.remove(relleno);relleno.dispose?.();}};
}

exports.corregirPisosEIluminacion = corregirPisosEIluminacion;
},
"./config.js": function(module, exports, __require) {

const CONFIG = {
  terreno: {ancho:180,largo:180,color:0x668b46,margenBorde:2},
  camino: {ancho:7,largo:30,centroZ:9,color:0xaaa18d},
  jugador: {altura:1.7,velocidad:5,multiplicadorCarrera:1.7,posicionInicial:{x:0,z:17}},
  camara: {fov:70,cerca:0.1,lejos:300},
  ambiente: {cielo:0xb9d8eb,nieblaCerca:110,nieblaLejos:230}
};

exports.CONFIG = CONFIG;
},
"./castillo.js": function(module, exports, __require) {
const THREE = __THREE;


// Reemplazo para la version jugable: conserva su API de movimiento y puertas.
function crearCastillo(escena) {
  const raiz=new THREE.Group();raiz.name='castillo-jugable';raiz.position.set(0,0,-22);escena.add(raiz);
  const obstaculos=[],superficies=[],puertas=[];
  const geoCaja=new THREE.BoxGeometry(1,1,1);
  const geometrias=new Set([geoCaja]),materiales=new Set(),texturas=new Set();
  const cache=new Map();
  let semilla=24;
  const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};

  // Texturas generadas localmente; no requieren imagenes ni descargas.
  function textura(tipo,relieve=false) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const ctx=canvas.getContext('2d');
    if(tipo==='piedra'||tipo==='suelo'||tipo==='techo') {
      ctx.fillStyle=relieve?'#303030':(tipo==='techo'?'#49321e':'#49483f');ctx.fillRect(0,0,512,512);
      const filas=tipo==='techo'?12:8,alto=512/filas,ancho=tipo==='suelo'?128:128;
      for(let f=0;f<filas;f++) for(let col=-1;col<5;col++) {
        const x=col*ancho+(f%2)*ancho/2,y=f*alto;
        const v=Math.floor(azar()*28);
        ctx.fillStyle=relieve?`rgb(${170+v},${170+v},${170+v})`:
          tipo==='techo'?`rgb(${143+v},${82+v},${38+v})`:`rgb(${128+v},${126+v},${112+v})`;
        ctx.fillRect(x+3,y+3,ancho-6,alto-6);
        ctx.strokeStyle=relieve?'#dedede':'rgba(255,245,210,0.2)';
        ctx.beginPath();ctx.moveTo(x+5,y+alto-6);ctx.lineTo(x+5,y+5);ctx.lineTo(x+ancho-6,y+5);ctx.stroke();
      }
    } else if(tipo==='madera') {
      ctx.fillStyle=relieve?'#999':'#70462a';ctx.fillRect(0,0,512,512);
      for(let i=0;i<8;i++) {
        ctx.fillStyle=relieve?'#333':'#382719';ctx.fillRect(i*64,0,4,512);
        for(let j=0;j<28;j++) {
          ctx.strokeStyle=relieve?'#858585':`rgba(30,15,5,${0.1+azar()*0.22})`;
          const x=i*64+5+azar()*52;
          ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+12,170,x-12,340,x,512);ctx.stroke();
        }
      }
    }
    if(!relieve) {
      const data=ctx.getImageData(0,0,512,512);
      for(let i=0;i<data.data.length;i+=4) {
        const n=(azar()-0.5)*14;
        for(let c=0;c<3;c++)data.data[i+c]=Math.max(0,Math.min(255,data.data[i+c]+n));
      }
      ctx.putImageData(data,0,0);
    }
    const t=new THREE.CanvasTexture(canvas);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    if(!relieve)t.colorSpace=THREE.SRGBColorSpace;
    texturas.add(t);return t;
  }
  const patrones={};
  for(const tipo of ['piedra','suelo','techo','madera'])patrones[tipo]={color:textura(tipo),bump:textura(tipo,true)};
  const tonos={piedra:0xc0c3b4,moldura:0xe3d6b4,suelo:0xddd0b4,techo:0xffffff,
    madera:0xffffff,oscuro:0x16211e,turquesa:0x16cdb6,alfombra:0x60372f,oro:0xc7a653,
    libro:0x3c625d,cama:0x6b546d,hierro:0x323a39};
  function mat(tipo,u=1,v=1) {
    u=Math.max(0.1,Math.round(u*10)/10);v=Math.max(0.1,Math.round(v*10)/10);
    const key=`${tipo}:${u}:${v}`;if(cache.has(key))return cache.get(key);
    const m=new THREE.MeshStandardMaterial({color:tonos[tipo]??0xffffff,roughness:tipo==='oro'?0.4:0.91,metalness:tipo==='oro'?0.55:tipo==='hierro'?0.5:0});
    const patron=patrones[tipo==='moldura'?'piedra':tipo];
    if(patron) {
      m.map=patron.color.clone();m.bumpMap=patron.bump.clone();
      for(const t of [m.map,m.bumpMap]){t.repeat.set(u,v);t.needsUpdate=true;texturas.add(t);}
      m.bumpScale=tipo==='madera'?0.035:0.055;
    }
    if(tipo==='turquesa'){m.emissive.setHex(0x16cdb6);m.emissiveIntensity=0.7;}
    materiales.add(m);cache.set(key,m);return m;
  }
  function caja(nombre,x,y,z,w,h,d,tipo='piedra',solido=false) {
    // Un material por orientacion: mantiene el tamaño de la textura al escalar.
    const materialesCaja=[mat(tipo,d/4,h/4),mat(tipo,d/4,h/4),mat(tipo,w/4,d/4),mat(tipo,w/4,d/4),mat(tipo,w/4,h/4),mat(tipo,w/4,h/4)];
    const o=new THREE.Mesh(geoCaja,materialesCaja);o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);
    o.castShadow=o.receiveShadow=true;raiz.add(o);
    if(solido)obstaculos.push({mesh:o,w,h,d,esCaja:true});return o;
  }
  function forma(nombre,geo,tipo,x,y,z) {
    geometrias.add(geo);const o=new THREE.Mesh(geo,mat(tipo,2,3));
    o.name=nombre;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;raiz.add(o);return o;
  }
  function piso(nombre,x,z,w,d,y,tipo='suelo') {
    caja(nombre,x,y-0.15,z,w,0.3,d,tipo);
    superficies.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,y});
  }
  const muro=(nombre,x,y,z,w,h,d)=>caja(nombre,x,y,z,w,h,d,'piedra',true);
  function puerta(nombre,x,z,base,rot=0,ancho=2.6,alto=3.6) {
    const marco=new THREE.Group();marco.position.set(x,base,z);marco.rotation.y=rot;raiz.add(marco);
    const pivote=new THREE.Group();pivote.position.x=-ancho/2;marco.add(pivote);
    const hoja=caja(nombre,ancho/2,alto/2,0,ancho,alto,0.22,'madera');
    pivote.add(hoja);
    obstaculos.push({mesh:hoja,w:ancho,h:alto,d:0.22,esCaja:true});
    for(const y of [0.55,alto-0.55]) {
      const banda=new THREE.Mesh(geoCaja,mat('hierro'));banda.scale.set(ancho-0.15,0.16,0.29);
      banda.position.set(ancho/2,y,0);pivote.add(banda);
    }
    const manija=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),mat('oro'));geometrias.add(manija.geometry);
    manija.position.set(ancho-0.23,alto*0.47,0.22);pivote.add(manija);
    for(const dx of [-ancho/2-0.12,ancho/2+0.12]) {
      const p=new THREE.Mesh(geoCaja,mat('moldura',0.2,1));p.scale.set(0.22,alto+0.2,0.5);p.position.set(dx,alto/2,0);marco.add(p);
    }
    const dintel=new THREE.Mesh(geoCaja,mat('moldura'));dintel.scale.set(ancho+0.5,0.25,0.5);dintel.position.y=alto+0.12;marco.add(dintel);
    puertas.push({nombre,marco,pivote,hoja,ancho,alto,abierta:false,angulo:0});
  }
  function paredConPuerta(nombre,x,z,largo,base,alto,eje='x') {
    const vano=2.6,h=3.6,trozo=(largo-vano)/2;
    for(const s of [-1,1])muro(nombre,x+(eje==='x'?s*(vano/2+trozo/2):0),base+alto/2,z+(eje==='z'?s*(vano/2+trozo/2):0),eje==='x'?trozo:0.65,alto,eje==='x'?0.65:trozo);
    muro('Dintel',x,base+h+(alto-h)/2,z,eje==='x'?vano:0.65,alto-h,eje==='x'?0.65:vano);
    puerta(nombre,x,z,base,eje==='x'?0:Math.PI/2);
  }
  function ventana(x,y,z,rot=0) {
    const grupo=new THREE.Group();grupo.position.set(x,y,z);grupo.rotation.y=rot;raiz.add(grupo);
    for(const [w,h,d,tipo] of [[1.1,2.3,0.12,'moldura'],[0.8,2,0.15,'turquesa']]) {
      const o=new THREE.Mesh(geoCaja,mat(tipo));o.scale.set(w,h,d);grupo.add(o);
    }
    const cruz=new THREE.Mesh(geoCaja,mat('hierro'));cruz.scale.set(0.05,2,0.18);grupo.add(cruz);
  }
  function almenas(x,z,largo,eje,y) {
    const n=Math.ceil(largo/1.3);
    for(let i=0;i<=n;i++){const t=-largo/2+i*largo/n;caja('Almena',x+(eje==='x'?t:0),y+0.4,z+(eje==='z'?t:0),0.65,0.85,0.65);}
  }
  function torre(x,z,r,base,alto,conica=true) {
    forma('Torre',new THREE.CylinderGeometry(r,r,alto,24),'piedra',x,base+alto/2,z);
    forma('Cornisa',new THREE.CylinderGeometry(r*1.12,r*1.12,0.4,24),'moldura',x,base+alto,z);
    if(conica)forma('Tejado ocre',new THREE.ConeGeometry(r*1.3,r*3,24),'techo',x,base+alto+r*1.5,z);
    else for(let i=0;i<12;i++){const a=i*Math.PI/6;caja('Almena',x+Math.cos(a)*r,base+alto+0.5,z+Math.sin(a)*r,0.6,1,0.6);}
    const bloque=new THREE.Object3D();bloque.position.set(x,base+alto/2,z);raiz.add(bloque);
    obstaculos.push({mesh:bloque,w:r*2,h:alto,d:r*2,esCaja:false});
    for(let y=base+2;y<base+alto-1;y+=4)ventana(x,y,z+r+0.04);
  }
  function escalera(nombre,x,inicio,ancho,n,huella,base,alto) {
    for(let i=0;i<n;i++){
      const y=base+(i+1)*alto,z=inicio-(i+0.5)*huella;
      caja(nombre,x,(base+y)/2,z,ancho,y-base,huella,'moldura');
      superficies.push({x1:x-ancho/2,x2:x+ancho/2,z1:z-huella/2,z2:z+huella/2,y});
    }
  }

  piso('Patio',0,30,48,28,0.03);
  muro('Muralla oeste',-24,2.2,30,0.8,4.4,28);muro('Muralla este',24,2.2,30,0.8,4.4,28);
  // Vano real en la gran muralla: no hay un muro oculto detras de la puerta.
  paredConPuerta('Salida de la gran muralla',0,44,48,0.03,4.4,'x');
  piso('Umbral de salida',0,44,4,3,0.03,'moldura');
  piso('Sendero exterior',0,58,4,25,0.025,'suelo');
  muro('Cierre frontal izquierdo',-16,2.2,16,16,4.4,0.8);
  muro('Cierre frontal derecho',16,2.2,16,16,4.4,0.8);
  almenas(-24,30,28,'z',4.4);almenas(24,30,28,'z',4.4);almenas(0,44,48,'x',4.43);
  for(const x of [-24,24])torre(x,44,1.6,0,6,false);
  // Refuerzos del porton, fuera del vano.
  for(const x of [-2.1,2.1])caja('Pilar del porton',x,2.4,44,0.8,4.8,1.1,'moldura',true);
  piso('Camino entrada',0,23,7,14,0.05,'moldura');
  escalera('Escalera exterior',0,28,6,12,0.8,0,0.25);
  piso('Descanso entrada',0,17.8,7,1.6,3,'moldura');
  for(const x of [-3.6,3.6])muro('Pretil de acceso',x,2.3,23,0.45,1.2,10);

  // Zocalo macizo: elimina la franja de cielo y cesped bajo las fachadas.
  muro('Cimentacion continua',0,1.5,0,40,3,36);
  for(const x of [-11.75,11.75]) {
    muro('Relleno lateral de acceso',x,1.5,18.4,16.5,3,1.6);
    caja('Remate del zocalo',x,2.9,18.45,16.6,0.2,1.7,'moldura');
  }
  piso('Planta baja',0,0,40,36,3);
  paredConPuerta('Entrada principal',0,18,40,3,14,'x');
  muro('Muro posterior',0,10,-18,40,14,0.8);
  muro('Muro oeste',-20,10,0,0.8,14,36);muro('Muro este',20,10,0,0.8,14,36);
  caja('Cornisa principal',0,17.1,0,41,0.4,37,'moldura');
  almenas(0,18,40,'x',17.3);almenas(0,-18,40,'x',17.3);
  almenas(-20,0,36,'z',17.3);almenas(20,0,36,'z',17.3);
  for(const base of [3,10])for(const lado of [-1,1]) {
    paredConPuerta(base===3?(lado<0?'Biblioteca':'Comedor'):(lado<0?'Dormitorio oeste':'Dormitorio este'),lado*7,8,20,base,7,'z');
    paredConPuerta(base===3?(lado<0?'Armeria':'Sala del consejo'):(lado<0?'Estudio':'Sala de mapas'),lado*7,-10,16,base,7,'z');
    muro('Division de habitaciones',lado*13.5,base+3.5,-2,13,7,0.6);
  }
  piso('Planta alta oeste',-13.5,0,13,36,10);piso('Planta alta este',13.5,0,13,36,10);
  piso('Galeria frontal',0,13,14,10,10);piso('Galeria posterior',0,-16,14,4,10);
  escalera('Escalera interior',0,0,5,28,0.5,3,0.25);
  for(const lado of [-1,1]){
    muro('Baranda lateral',lado*6.8,10.65,-3,0.24,1.3,22);
    muro('Baranda frontal',lado*4.7,10.65,8,4.4,1.3,0.24);
  }
  for(const x of [-4.8,4.8])muro('Baranda descanso',x,10.65,-14,4.4,1.3,0.24);
  caja('Alfombra vestibulo',0,3.015,9,5,0.025,12,'alfombra');
  for(const base of [3,10]) {
    for(const x of [-19.5,19.5])for(const z of [-12,0,12])ventana(x,base+3,z,Math.PI/2);
    for(const x of [-15,-10,10,15])ventana(x,base+3,18.46);
    for(const x of [-17,17]){
      caja('Mesa',x,base+0.9,-9,3.6,1.8,2,'madera',true);
      caja('Armario',x,base+1.7,-16,3,3.4,0.9,'madera',true);
    }
  }
  for(let i=0;i<4;i++) {
    caja('Estanteria',-18.9,4.7,2+i*3.8,1,3.4,2.8,'madera',true);
    for(let j=0;j<5;j++)caja('Libros',-18.3,4+j*0.45,2+i*3.8,0.15,0.28,2.4,'libro');
  }
  caja('Mesa comedor',14,4,8,4,2,7,'madera',true);
  for(const x of [-14,14]){
    caja('Cama',x,10.65,9,3,1.3,5,'cama',true);
    caja('Cabecera',x,11.2,6.5,3,2.4,0.35,'madera',true);
  }
  for(const [x,z,r,b,h] of [[-20,17,2.1,0,23],[20,17,2.1,0,21],[-20,-16,1.9,0,28],[20,-16,1.9,0,25],[-7,-7,1.3,17.4,18],[7,-6,1.2,17.4,14],[-4,-11,1,27,18]])torre(x,z,r,b,h);
  caja('Torre central superior',0,24,-7,9,13,9,'piedra',true);
  caja('Cornisa torre',0,30.6,-7,9.5,0.4,9.5,'moldura');
  forma('Tejado central',new THREE.ConeGeometry(7.1,7,4),'techo',0,34.3,-7).rotation.y=Math.PI/4;
  for(const x of [-2,2])ventana(x,26,-2.42);
  for(const [x,z] of [[0,8],[-13,8],[13,8],[-13,-10],[13,-10]])for(const y of [7,14]) {
    const luz=new THREE.PointLight(0xffdca8,45,20,2);luz.position.set(x,y,z);raiz.add(luz);
  }
  const local=new THREE.Vector3(),centro=new THREE.Vector3();
  const rejilla=new Map(),moviles=[];
  let listaColisiones=null;
  function actualizarFicha(f) {
    f.o.mesh.updateWorldMatrix(true,false);
    f.inversa.copy(f.o.mesh.matrixWorld).invert();
    const o=f.o;
    f.caja.set(new THREE.Vector3(o.esCaja?-0.5:-o.w/2,o.esCaja?-0.5:-o.h/2,o.esCaja?-0.5:-o.d/2),
      new THREE.Vector3(o.esCaja?0.5:o.w/2,o.esCaja?0.5:o.h/2,o.esCaja?0.5:o.d/2)).applyMatrix4(o.mesh.matrixWorld);
  }
  function prepararColisiones() {
    raiz.updateMatrixWorld(true);rejilla.clear();moviles.length=0;
    const hojas=new Set(puertas.map(p=>p.hoja));
    listaColisiones=obstaculos.map(o=>({o,inversa:new THREE.Matrix4(),caja:new THREE.Box3()}));
    for(const f of listaColisiones) {
      actualizarFicha(f);
      if(hojas.has(f.o.mesh)){moviles.push(f);continue;}
      const b=f.caja;
      for(let x=Math.floor((b.min.x-0.7)/8);x<=Math.floor((b.max.x+0.7)/8);x++)
        for(let z=Math.floor((b.min.z-0.7)/8);z<=Math.floor((b.max.z+0.7)/8);z++){
          const k=x+','+z;if(!rejilla.has(k))rejilla.set(k,[]);rejilla.get(k).push(f);
        }
    }
    for(const p of puertas)p.fichaColision=moviles.find(f=>f.o.mesh===p.hoja);
  }
  function toca(f,x,z,pies,altura,radio) {
    const b=f.caja;
    if(x<b.min.x-radio||x>b.max.x+radio||z<b.min.z-radio||z>b.max.z+radio||pies>=b.max.y-0.06||pies+altura<=b.min.y+0.06)return false;
    centro.set(x,pies+altura/2,z);local.copy(centro).applyMatrix4(f.inversa);
    const o=f.o,lx=local.x*(o.esCaja?o.w:1),ly=local.y*(o.esCaja?o.h:1),lz=local.z*(o.esCaja?o.d:1);
    return Math.abs(ly)<o.h/2+altura/2-0.06&&Math.abs(lx)<o.w/2+radio&&Math.abs(lz)<o.d/2+radio;
  }
  function bloqueado(x,z,pies,altura=1.7,radio=0.32) {
    if(!listaColisiones)prepararColisiones();
    for(const f of rejilla.get(Math.floor(x/8)+','+Math.floor(z/8))||[])if(toca(f,x,z,pies,altura,radio))return true;
    for(const f of moviles)if(toca(f,x,z,pies,altura,radio))return true;
    return false;
  }
  function alturaSuelo(x,z,pies) {
    x-=raiz.position.x;z-=raiz.position.z;let y=0;
    for(const s of superficies)if(x>=s.x1-0.001&&x<=s.x2+0.001&&z>=s.z1-0.001&&z<=s.z2+0.001&&s.y<=pies+0.32)y=Math.max(y,s.y);
    return y;
  }
  function puertaCercana(camara) {
    const direccion=new THREE.Vector3();camara.getWorldDirection(direccion);
    let elegida=null,distancia=3.3;
    for(const p of puertas) {
      const vector=p.marco.localToWorld(new THREE.Vector3(0,1.6,0)).sub(camara.position),d=vector.length();
      if(d<distancia&&vector.normalize().dot(direccion)>0.35){elegida=p;distancia=d;}
    }
    return elegida;
  }
  function actualizar(dt,camara,pies) {
    if(!listaColisiones)prepararColisiones();
    for(const p of puertas) {
      const objetivo=p.abierta?-Math.PI*0.52:0;
      if(Math.abs(p.angulo-objetivo)<0.0001)continue;
      const previo=p.angulo;
      p.angulo=THREE.MathUtils.damp(previo,objetivo,9,dt);
      if(Math.abs(p.angulo-objetivo)<0.0001)p.angulo=objetivo;
      p.pivote.rotation.y=p.angulo;p.pivote.updateWorldMatrix(true,true);
      actualizarFicha(p.fichaColision);
      if(toca(p.fichaColision,camara.position.x,camara.position.z,pies,1.7,0.32)) {
        p.angulo=previo;p.pivote.rotation.y=previo;p.pivote.updateWorldMatrix(true,true);actualizarFicha(p.fichaColision);
      }
    }
  }
  Object.assign(raiz.userData,{bloqueado,alturaSuelo,actualizar,puertaCercana,prepararColisiones,
    interactuar(camara){const p=puertaCercana(camara);if(p)p.abierta=!p.abierta;},
    puertas,grupos:{exterior:raiz},colisiones:obstaculos,
    liberar(){raiz.removeFromParent();for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();}
  });
  return raiz;
}

exports.crearCastillo = crearCastillo;
},
"./estudioMaravillas.js": function(module, exports, __require) {
const THREE = __THREE;


const MELODIA_ESTUDIO = Object.freeze([60,64,67,72,71,67,64,62,65,69,72,76,74,72,69,67]);
const MENSAJE_ESTUDIO = 'Gracias por entrar en este pequeño mundo.\nQue la curiosidad te siga abriendo puertas y que siempre encuentres belleza en las cosas sencillas.';

function crearEstudioMaravillas(escena,camara,castillo,elemento,opciones={}){
  if(castillo.userData.estudioMaravillas)return castillo.userData.estudioMaravillas;
  const ROOM='Estudio',raiz=new THREE.Group();raiz.name='Estudio de las pequeñas maravillas';castillo.add(raiz);
  const geometrias=new Set(),materiales=new Set(),texturas=new Set(),propios=[],ocultos=[],retirados=[];
  const colisiones=castillo.userData.colisiones,geoCaja=new THREE.BoxGeometry(1,1,1),geoEsfera=new THREE.SphereGeometry(1,18,12);geometrias.add(geoCaja);geometrias.add(geoEsfera);
  const marcar=o=>{Object.assign(o.userData,{habitacion:ROOM,noAgrupar:true,dinamico:true});return o;};marcar(raiz);
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.84,...extra});materiales.add(m);return m;}
  const nogal=material('#392b25'),moldura=material('#6d4d36'),oro=material('#c9a665',{metalness:.58,roughness:.38}),verde=material('#284c4c'),crema=material('#e2d4b5'),terciopelo=material('#704451');
  function caja(nombre,x,y,z,w,h,d,mat,padre=raiz,solido=false){const o=marcar(new THREE.Mesh(geoCaja,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;padre.add(o);if(solido&&Array.isArray(colisiones)){const r={mesh:o,w,h,d,esCaja:true};colisiones.push(r);propios.push(r);}return o;}
  function esfera(nombre,x,y,z,sx,sy,sz,mat,padre=raiz){const o=marcar(new THREE.Mesh(geoEsfera,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function cilindro(x,y,z,r,h,mat,padre=raiz,rt=r){const g=new THREE.CylinderGeometry(rt,r,h,20);geometrias.add(g);const o=marcar(new THREE.Mesh(g,mat));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function varilla(a,b,r,mat,padre=raiz){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),dir=vb.clone().sub(va);const g=new THREE.CylinderGeometry(r,r,dir.length(),10);geometrias.add(g);const o=marcar(new THREE.Mesh(g,mat));o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function tex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;texturas.add(t);return t;}
  function plano(c,w,h,x,y,z,ry=0,padre=raiz){const g=new THREE.PlaneGeometry(w,h);geometrias.add(g);const m=new THREE.MeshBasicMaterial({map:tex(c),toneMapped:false});materiales.add(m);const o=marcar(new THREE.Mesh(g,m));o.position.set(x,y,z);o.rotation.y=ry;padre.add(o);return o;}
  let semilla=713492;const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  castillo.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),bb=new THREE.Box3(),zona=new THREE.Box3(new THREE.Vector3(-19.7,9.99,-17.8),new THREE.Vector3(-7.35,16.95,-2.32));
  castillo.traverse(o=>{if(!o.isMesh||!/^(Mesa|Armario)(\s|$)/i.test(o.name))return;bb.setFromObject(o).applyMatrix4(inv);if(zona.containsBox(bb))ocultos.push({objeto:o,visible:o.visible});});ocultos.forEach(r=>r.objeto.visible=false);
  if(Array.isArray(colisiones)){const quitar=new Set(ocultos.map(r=>r.objeto));for(let i=colisiones.length-1;i>=0;i--)if(quitar.has(colisiones[i].mesh))retirados.push({indice:i,valor:colisiones.splice(i,1)[0]});}
  // Revestimientos locales y vano del este libre.
  caja('Estudio · Pared oeste',-19.585,13.5,-10,.018,6.96,15.2,verde);
  for(const z of [-17.585,-2.315])caja('Estudio · Pared transversal',-13.5,13.5,z,12.25,6.96,.018,verde);
  for(const z of [-14.5,-5.5])caja('Estudio · Pared de acceso',-7.335,13.5,z,.018,6.96,6.34,verde);
  caja('Estudio · Dintel',-7.335,15.3,-10,.018,3.36,2.66,verde);
  const matPiso=material('#84654a');caja('Estudio · Piso de nogal',-13.5,10.05,-9.98,12.22,.012,15.22,matPiso);
  const pisoC=canvas(512,512),pc=pisoC.getContext('2d');pc.fillStyle='#856649';pc.fillRect(0,0,512,512);
  for(let i=0;i<8;i++){pc.fillStyle=i%2?'#896b50':'#795b43';pc.fillRect(0,i*64,512,64);pc.strokeStyle='#392b2666';pc.strokeRect(0,i*64,512,64);for(let j=0;j<5;j++){pc.beginPath();pc.moveTo(0,i*64+10+j*9);pc.bezierCurveTo(170,i*64+4+j*9,340,i*64+16+j*9,512,i*64+8+j*9);pc.stroke();}}
  const mapaPiso=tex(pisoC);mapaPiso.wrapS=mapaPiso.wrapT=THREE.RepeatWrapping;mapaPiso.repeat.set(3,4);matPiso.map=mapaPiso;matPiso.color.set('#ffffff');
  for(const z of [-17.48,-2.43]){caja('Estudio · Zócalo',-13.5,10.66,z,12.1,1.12,.12,nogal);caja('Estudio · Pasamanos dorado',-13.5,11.25,z,12.1,.045,.16,oro);caja('Estudio · Cornisa',-13.5,16.30,z,12.1,.18,.17,moldura);}
  caja('Estudio · Zócalo oeste',-19.48,10.66,-10,.12,1.12,15.0,nogal);caja('Estudio · Borde oeste',-19.45,11.25,-10,.15,.045,15,oro);
  const techo=canvas(768,1024),tc=techo.getContext('2d');tc.fillStyle='#233b3d';tc.fillRect(0,0,768,1024);
  for(let a=0;a<3;a++)for(let b=0;b<4;b++){const x=a*256,y=b*256;tc.fillStyle='#2a4444';tc.fillRect(x+18,y+18,220,220);tc.strokeStyle='#997d4f';tc.lineWidth=3;tc.strokeRect(x+28,y+28,200,200);tc.strokeStyle='#b79861';tc.lineWidth=1;tc.strokeRect(x+36,y+36,184,184);tc.fillStyle='#ba9a64';tc.beginPath();tc.arc(x+128,y+128,7,0,Math.PI*2);tc.fill();}
  const artesonado=plano(techo,12.1,15.1,-13.5,16.55,-10);artesonado.rotation.x=Math.PI/2;
  const alf=canvas(512,512),ac=alf.getContext('2d');ac.fillStyle='#603e4b';ac.fillRect(0,0,512,512);for(const d of [12,23,40]){ac.strokeStyle=d===23?'#b99a64':'#977960';ac.lineWidth=3;ac.strokeRect(d,d,512-2*d,512-2*d);}ac.strokeStyle='#c7aa76';ac.lineWidth=2;ac.beginPath();ac.moveTo(256,130);ac.lineTo(350,256);ac.lineTo(256,382);ac.lineTo(162,256);ac.closePath();ac.stroke();
  const alfombra=plano(alf,8.4,10.3,-13.5,10.071,-9.2);alfombra.rotation.x=-Math.PI/2;
  // Libreros con volúmenes agrupados por material.
  const coloresLibro=['#6b4354','#42646b','#8b744e','#6d6384','#8b574a'].map(c=>material(c));const libros=[];
  function librero(x){
    caja('Estudio · Fondo del librero',x,12.24,-17.15,3.55,4.25,.62,nogal,raiz,true);
    for(const dx of [-1.79,1.79])caja('Estudio · Columna tallada',x+dx,12.27,-16.77,.15,4.42,.22,moldura);
    for(let f=0;f<5;f++){
      const y=10.35+f*.79;caja('Estudio · Repisa',x,y,-16.76,3.72,.11,.91,moldura);
      for(let dx=-1.58;dx<1.60;){const w=.12+azar()*.15,h=.43+azar()*.20;libros.push({x:x+dx+w/2,y:y+.055+h/2,z:-16.78,w,h,d:.42,mat:coloresLibro[Math.floor(azar()*coloresLibro.length)]});dx+=w+.028;}
    }
    caja('Estudio · Cornisa de librero',x,14.55,-17,3.92,.20,.98,oro);
  }
  librero(-17.3);librero(-9.7);
  const lotes=new Map();for(const l of libros){if(!lotes.has(l.mat))lotes.set(l.mat,[]);lotes.get(l.mat).push(l);}
  for(const [mat,lista] of lotes){const lote=marcar(new THREE.InstancedMesh(geoCaja,mat,lista.length));lote.name='Estudio · Libros agrupados';const d=new THREE.Object3D();lista.forEach((l,i)=>{d.position.set(l.x,l.y,l.z);d.scale.set(l.w,l.h,l.d);d.updateMatrix();lote.setMatrixAt(i,d.matrix);});lote.instanceMatrix.needsUpdate=true;lote.computeBoundingSphere();lote.castShadow=lote.receiveShadow=true;raiz.add(lote);}
  // Reloj alto: caja hueca, esfera, agujas y péndulo.
  const relojAlto=new THREE.Group();relojAlto.position.set(-13.5,10.09,-17.13);raiz.add(relojAlto);
  caja('Estudio · Fondo del reloj',0,2.2,-.23,1.30,4.4,.12,nogal,relojAlto);
  for(const x of [-.62,.62])caja('Estudio · Columna del reloj',x,2.2,.02,.14,4.4,.65,moldura,relojAlto);
  caja('Estudio · Base del reloj',0,.15,.02,1.48,.30,.85,moldura,relojAlto);caja('Estudio · Corona del reloj',0,4.47,.02,1.48,.24,.85,oro,relojAlto);
  const dial=canvas(512,512),dc=dial.getContext('2d');dc.fillStyle='#e6d8b8';dc.fillRect(0,0,512,512);dc.strokeStyle='#8e744a';dc.lineWidth=7;dc.beginPath();dc.arc(256,256,235,0,Math.PI*2);dc.stroke();dc.fillStyle='#4d4438';dc.textAlign='center';dc.textBaseline='middle';dc.font='32px Georgia';const romanos=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];for(let i=0;i<12;i++){const a=i*Math.PI/6-Math.PI/2;dc.fillText(romanos[i],256+Math.cos(a)*184,256+Math.sin(a)*184);}
  const gDial=new THREE.CircleGeometry(.53,48);geometrias.add(gDial);const mDial=new THREE.MeshBasicMaterial({map:tex(dial),toneMapped:false});materiales.add(mDial);const caraReloj=marcar(new THREE.Mesh(gDial,mDial));caraReloj.position.set(0,3.83,.38);relojAlto.add(caraReloj);
  const agujas=[];for(const [h,w] of [[.28,.032],[.39,.023],[.43,.010]]){const p=new THREE.Group();p.position.set(0,3.83,.40+agujas.length*.012);caja('Estudio · Aguja',0,h/2,0,w,h,.015,agujas.length===2?moldura:oro,p);relojAlto.add(p);agujas.push(p);}esfera('Estudio · Centro del reloj',0,3.83,.45,.045,.045,.02,oro,relojAlto);
  const pendulo=new THREE.Group();pendulo.position.set(0,3.10,.22);relojAlto.add(pendulo);varilla([0,0,0],[0,-1.65,0],.020,oro,pendulo);esfera('Estudio · Disco de péndulo',0,-1.65,0,.22,.22,.055,oro,pendulo);
  const cristal=material('#b1c1ba',{transparent:true,opacity:.16,depthWrite:false,roughness:.18});caja('Estudio · Cristal de reloj',0,1.95,.37,.98,2.0,.025,cristal,relojAlto);
  const invisible=material('#ffffff');invisible.visible=false;const proxyReloj=caja('Estudio · Colisión del reloj',-13.5,12.35,-17.1,1.5,4.55,.9,invisible,raiz,true);proxyReloj.castShadow=proxyReloj.receiveShadow=false;
  // Escritorio, sillón y detalles de lectura.
  caja('Estudio · Escritorio',-13.5,10.68,-9.2,4.7,1.2,2.1,nogal,raiz,true);caja('Estudio · Tapa del escritorio',-13.5,11.33,-9.2,4.95,.13,2.28,moldura);
  for(const x of [-15.25,-11.75])for(let y=10.35;y<11.1;y+=.25){caja('Estudio · Cajón',x,y,-8.12,1.15,.21,.05,moldura);esfera('Estudio · Tirador',x,y,-8.07,.045,.025,.025,oro);}
  const silla=new THREE.Group();silla.position.set(-13.5,10.08,-6.85);silla.rotation.y=Math.PI;raiz.add(silla);caja('Estudio · Asiento',0,.53,0,1.45,.36,1.3,terciopelo,silla,true);caja('Estudio · Respaldo',0,1.16,-.50,1.45,1.18,.26,terciopelo,silla);for(const x of [-.72,.72])caja('Estudio · Brazo de sillón',x,.89,0,.15,.40,1.2,moldura,silla);
  for(const x of [-.55,.55])for(const z of [-.43,.43])caja('Estudio · Pata de sillón',x,.20,z,.13,.4,.13,oro,silla);
  const papel=canvas(512,360),pp=papel.getContext('2d');pp.fillStyle='#eee1bf';pp.fillRect(0,0,512,360);pp.strokeStyle='#b29866';pp.strokeRect(14,14,484,332);pp.fillStyle='#665840';pp.textAlign='center';pp.font='28px Georgia';pp.fillText('Las pequeñas maravillas',256,90);pp.font='21px Georgia';pp.fillText('También merecen una pausa.',256,140);pp.strokeStyle='#baa575';for(let i=0;i<5;i++){pp.beginPath();pp.moveTo(80,195+i*23);pp.lineTo(432-(i%2)*40,195+i*23);pp.stroke();}
  const hoja=plano(papel,1.0,.72,-12.2,11.411,-9.1);hoja.rotation.x=-Math.PI/2;
  cilindro(-11.55,11.54,-9.5,.10,.26,material('#263f42'));varilla([-11.55,11.62,-9.5],[-11.35,12.1,-9.57],.012,oro);
  const pluma=esfera('Estudio · Pluma',-11.31,12.15,-9.58,.047,.22,.013,crema);pluma.rotation.z=-.35;
  cilindro(-15.35,11.55,-9.8,.20,.28,oro);varilla([-15.35,11.5,-9.8],[-15.35,12.45,-9.8],.028,oro);
  const pantallaGeo=new THREE.ConeGeometry(.40,.35,24,1,true);geometrias.add(pantallaGeo);const pantallaMat=material('#cdbb8c',{side:THREE.DoubleSide});const pantalla=marcar(new THREE.Mesh(pantallaGeo,pantallaMat));pantalla.position.set(-15.35,12.5,-9.8);raiz.add(pantalla);
  const bombillaMat=material('#ffe2a0',{emissive:'#ffc876',emissiveIntensity:1.2});esfera('Estudio · Bombilla',-15.35,12.34,-9.8,.08,.09,.08,bombillaMat);
  // Cortinas enmarcan la ventana, sin taparla.
  const cortinaMat=material('#86666a');for(const z of [-12.83,-11.17])for(let i=0;i<4;i++)esfera('Estudio · Pliegue de cortina',-19.39,13.28,z+(i-1.5)*.055,.11,1.56,.055,cortinaMat);
  varilla([-19.35,14.94,-13.14],[-19.35,14.94,-10.86],.026,oro);
  const cartel=canvas(1024,220),cc=cartel.getContext('2d');cc.fillStyle='#263e40';cc.fillRect(0,0,1024,220);cc.strokeStyle='#c0a064';cc.lineWidth=4;cc.strokeRect(12,12,1000,196);cc.fillStyle='#efdcb0';cc.textAlign='center';cc.font='43px Georgia';cc.fillText('ESTUDIO DE LAS PEQUEÑAS MARAVILLAS',512,95);cc.font='24px Georgia';cc.fillText('Detenerse también es parte del viaje',512,158);plano(cartel,6.7,1.30,-13.5,15.25,-2.40,Math.PI);
  // Caja mecánica con bisagra real y flor de pétalos articulados.
  const cajita=new THREE.Group();cajita.position.set(-13.45,11.42,-9.05);cajita.rotation.y=Math.PI/2;raiz.add(cajita);
  const forro=material('#633b53');caja('Estudio · Fondo de cajita',0,.06,0,1.45,.12,.88,nogal,cajita);
  for(const x of [-.70,.70])caja('Estudio · Lateral de cajita',x,.28,0,.09,.43,.88,moldura,cajita);
  for(const z of [-.40,.40])caja('Estudio · Frente de cajita',0,.28,z,1.33,.43,.08,moldura,cajita);
  caja('Estudio · Forro interior',0,.13,0,1.25,.03,.69,forro,cajita);
  const bisagra=new THREE.Group();bisagra.position.set(0,.49,-.44);cajita.add(bisagra);caja('Estudio · Tapa móvil',0,0,.44,1.5,.10,.90,nogal,bisagra);caja('Estudio · Incrustación de tapa',0,.057,.44,1.30,.018,.70,oro,bisagra);caja('Estudio · Terciopelo de tapa',0,-.058,.44,1.28,.02,.68,forro,bisagra);
  esfera('Estudio · Cierre de la caja',0,.30,.455,.08,.07,.018,oro,cajita);
  const flor=new THREE.Group();flor.position.y=.15;cajita.add(flor);
  cilindro(0,.10,0,.23,.07,oro,flor);varilla([0,.12,0],[0,.73,0],.026,oro,flor);
  const hojaFlorMat=material('#719b94',{metalness:.25,roughness:.4});for(const lado of [-1,1]){const l=esfera('Estudio · Hoja de flor',lado*.12,.43,0,.15,.05,.035,hojaFlorMat,flor);l.rotation.z=lado*.55;}
  const cristalFlor=material('#dbc1a5',{metalness:.28,roughness:.26,transparent:true,opacity:.89,side:THREE.DoubleSide,emissive:'#67452d',emissiveIntensity:.18});
  const petalos=[];for(let i=0;i<12;i++){const p=new THREE.Group();p.position.y=.75;p.rotation.y=i*Math.PI*2/12;flor.add(p);const q=new THREE.Group();p.add(q);esfera('Estudio · Pétalo de cristal',0,.235,0,.105,.27,.040,i%3===0?oro:cristalFlor,q);petalos.push({grupo:q,interior:i%2===0});}
  const centroFlorMat=material('#ffe2a1',{emissive:'#ffc364',emissiveIntensity:.2,roughness:.4});esfera('Estudio · Corazón de flor',0,.79,0,.115,.10,.115,centroFlorMat,flor);
  const engranaje=new THREE.Group();engranaje.position.y=.18;flor.add(engranaje);cilindro(0,0,0,.18,.035,oro,engranaje);for(let i=0;i<12;i++){const a=i*Math.PI/6;const t=caja('Estudio · Diente de engranaje',Math.cos(a)*.18,0,Math.sin(a)*.18,.055,.042,.05,oro,engranaje);t.rotation.y=-a;}
  const glowC=canvas(64,64),gc=glowC.getContext('2d'),gr=gc.createRadialGradient(32,32,0,32,32,31);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba(255,233,179,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');gc.fillStyle=gr;gc.fillRect(0,0,64,64);const glowTex=tex(glowC);
  const fulgorMat=new THREE.SpriteMaterial({map:glowTex,color:'#ffdf95',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(fulgorMat);const fulgor=new THREE.Sprite(fulgorMat);fulgor.position.set(0,.85,0);fulgor.scale.set(.65,.65,1);flor.add(fulgor);
  const semillas=Array.from({length:72},()=>({a:azar()*Math.PI*2,r:.16+azar()*.60,y:azar()})),pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(semillas.length*3),3));geometrias.add(pg);
  const pm=new THREE.PointsMaterial({map:glowTex,color:'#ffe4aa',size:.045,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(pm);const chispas=new THREE.Points(pg,pm);chispas.frustumCulled=false;cajita.add(chispas);
  flor.scale.setScalar(.22);flor.position.y=.13;
  // Reloj de arena reversible, sin colisiones móviles.
  const arenaBase=new THREE.Group();arenaBase.position.set(-14.9,11.42,-8.96);raiz.add(arenaBase);
  const arenaGiro=new THREE.Group();arenaGiro.position.y=.54;arenaBase.add(arenaGiro);const ampolleta=new THREE.Group();ampolleta.position.y=-.54;arenaGiro.add(ampolleta);
  cilindro(0,.035,0,.32,.07,oro,ampolleta);cilindro(0,1.045,0,.32,.07,oro,ampolleta);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;varilla([Math.cos(a)*.30,.07,Math.sin(a)*.30],[Math.cos(a)*.30,1.01,Math.sin(a)*.30],.016,oro,ampolleta);}
  const vidrioArena=material('#ccdcd8',{transparent:true,opacity:.19,depthWrite:false,roughness:.14,side:THREE.DoubleSide});
  for(const [rt,rb,cy] of [[.27,.027,.77],[.027,.27,.31]]){const g=new THREE.CylinderGeometry(rt,rb,.43,28,1,true);geometrias.add(g);const o=marcar(new THREE.Mesh(g,vidrioArena));o.position.y=cy;o.castShadow=false;ampolleta.add(o);}
  const arenaMat=material('#d8bc83',{roughness:1});const gArena=new THREE.ConeGeometry(.244,.4,28);geometrias.add(gArena);
  const arenaArriba=marcar(new THREE.Mesh(gArena,arenaMat));arenaArriba.rotation.z=Math.PI;ampolleta.add(arenaArriba);
  const arenaAbajo=marcar(new THREE.Mesh(gArena,arenaMat));ampolleta.add(arenaAbajo);
  const hilo=cilindro(0,.37,0,.010,.36,arenaMat,ampolleta);hilo.castShadow=false;
  const luz=new THREE.PointLight(0xffd5a4,24,13,2);luz.position.set(-13.5,15.1,-9.6);luz.castShadow=false;raiz.add(luz);marcar(luz);

  // Estado local de esta visita: no lee deseos, notas ni progreso de las otras salas.
  const id='estudio-maravillas',estilo=document.createElement('style');estilo.textContent=`
  #${id}[hidden],#${id} [hidden],#${id}-abrir[hidden]{display:none!important}
  #${id},#${id}-abrir{box-sizing:border-box;font:14px/1.55 system-ui,sans-serif;color:#f3e7ce}
  #${id}{position:fixed;inset:0;z-index:34000;display:flex;align-items:flex-end;justify-content:center;padding:14px;background:transparent}
  #${id} *{box-sizing:border-box}
  #${id} .em-caja{position:relative;width:min(880px,100%);max-height:46dvh;overflow:auto;padding:21px 23px;border:1px solid #b99d62;border-radius:18px;background:linear-gradient(135deg,#203d3ef5,#172b30f5);box-shadow:0 18px 65px #0007}
  #${id} h2{font:clamp(22px,3.5vw,30px) Georgia,serif;color:#f6dfad;margin:0 65px 7px 0}
  #${id} p{margin:8px 0}
  #${id} button,#${id}-abrir{min-height:44px;padding:10px 14px;border:1px solid #b29a64;border-radius:9px;background:#365456;color:#f7e8c8;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
  #${id} button:hover,#${id}-abrir:hover{background:#4e6b69}
  #${id} button[aria-pressed=true]{background:#806640;border-color:#dfc083}
  #${id} button:disabled{opacity:.45;cursor:wait}
  #${id} :focus-visible,#${id}-abrir:focus-visible{outline:3px solid #ffdc8a;outline-offset:3px}
  #${id} .em-cerrar{position:absolute;right:12px;top:12px}
  #${id} .em-fila{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
  #${id} .em-estado{color:#ead7ad;white-space:pre-line}
  #${id} .em-mensaje{font:clamp(17px,2.7vw,21px)/1.75 Georgia,serif;color:#f2dfb9;white-space:pre-line}
  #${id} .em-nota{font-size:12px;color:#b2bdb8}
  #${id}-abrir{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:29;max-width:90vw;background:#213f42ed;box-shadow:0 5px 25px #0006}
  @media(max-width:600px){#${id}{padding:7px}#${id} .em-caja{padding:16px 12px;max-height:48dvh}#${id} button{font-size:12px;padding:10px}#${id} h2{font-size:22px}}
  `;document.head.appendChild(estilo);
  const panel=document.createElement('section');panel.id=id;panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby',id+'-titulo');
  panel.innerHTML=`<div class="em-caja"><button type="button" class="em-cerrar">Cerrar</button><h2 id="${id}-titulo">Las pequeñas maravillas</h2><div class="em-fila"><button type="button" data-modo="caja">Caja mecánica</button><button type="button" data-modo="arena">Reloj de arena</button><button type="button" data-modo="mensaje">Una última pausa</button></div><div class="em-caja-controles em-fila"><button type="button" class="em-abrir-caja">Abrir cajita</button><button type="button" class="em-musica">Activar melodía</button></div><div class="em-arena-controles em-fila" hidden><button type="button" class="em-girar">Girar el reloj</button><span class="em-arena-tiempo" role="timer"></span></div><p class="em-mensaje" hidden></p><p class="em-estado" role="status" aria-live="polite"></p><p class="em-nota">La música es opcional y se genera en el navegador. No empieza sola. R: interactuar · Esc: cerrar.</p></div>`;document.body.appendChild(panel);
  const abrirBtn=document.createElement('button');abrirBtn.id=id+'-abrir';abrirBtn.type='button';abrirBtn.hidden=true;abrirBtn.textContent='R · Descubrir el estudio';document.body.appendChild(abrirBtn);
  const titulo=panel.querySelector('h2'),estado=panel.querySelector('.em-estado'),cerrarBtn=panel.querySelector('.em-cerrar'),cajaBtn=panel.querySelector('.em-abrir-caja'),audioBtn=panel.querySelector('.em-musica'),girarBtn=panel.querySelector('.em-girar'),tiempoArena=panel.querySelector('.em-arena-tiempo'),mensaje=panel.querySelector('.em-mensaje');mensaje.textContent=MENSAJE_ESTUDIO;
  const menu=document.getElementById('menu'),reducido=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let controles=null,oclusion=null,liberado=false,abierto=false,dentro=false,cercaCaja=false,cercaArena=false,modo='caja',reloj=0;
  let objetivoCaja=false,apertura=0,fraccionArena=1,arenaActiva=false,giroArena=null,segundoAnterior=-1;
  let recuerdoCamara=null,origenVista=null,destinoVista=null,tiempoVista=0;
  const duracionArena=24,localCam=new THREE.Vector3();
  // Audio sintetizado únicamente tras el clic de la persona.
  let contextoAudio=null,maestro=null,audioActivo=false,audioPreparando=false,versionAudio=0,notaAudio=0,proximaNota=0,avisoAudio='';const nodosAudio=new Set();
  function silenciar(){
    audioActivo=false;audioPreparando=false;versionAudio++;
    if(contextoAudio&&maestro){const t=contextoAudio.currentTime;maestro.gain.cancelScheduledValues(t);maestro.gain.setTargetAtTime(0,t,.025);for(const n of nodosAudio){try{n.osc.stop(t+.08);}catch{}}}
  }
  async function alternarAudio(){
    if(audioActivo||audioPreparando){silenciar();interfaz();return;}
    const version=++versionAudio;audioPreparando=true;avisoAudio='';objetivoCaja=true;interfaz();
    try{
      const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)throw new Error('Este navegador no pudo activar el audio.');
      if(!contextoAudio){contextoAudio=new Ctor();maestro=contextoAudio.createGain();maestro.gain.value=0;maestro.connect(contextoAudio.destination);}
      await contextoAudio.resume();
      if(liberado||!abierto||version!==versionAudio)return;
      if(contextoAudio.state!=='running')throw new Error('Pulsa nuevamente Activar melodía para permitir el audio.');
      audioActivo=true;notaAudio=0;proximaNota=contextoAudio.currentTime+.08;maestro.gain.setTargetAtTime(.085,contextoAudio.currentTime,.12);
    }catch(e){if(!liberado&&version===versionAudio){audioActivo=false;avisoAudio=e.message;}}
    finally{if(version===versionAudio)audioPreparando=false;if(!liberado)interfaz();}
  }
  function programarSonido(){
    if(!audioActivo||!contextoAudio||contextoAudio.state!=='running'||!abierto||!objetivoCaja||apertura<.45)return;
    const ahora=contextoAudio.currentTime;if(proximaNota<ahora-.2)proximaNota=ahora+.05;
    while(proximaNota<ahora+.20){
      const midi=MELODIA_ESTUDIO[notaAudio%MELODIA_ESTUDIO.length],frecuencia=440*Math.pow(2,(midi-69)/12),inicio=proximaNota;
      for(const [multiplicador,volumen,tipo] of [[1,.72,'sine'],[2,.09,'sine']]){
        const osc=contextoAudio.createOscillator(),ganancia=contextoAudio.createGain();osc.type=tipo;osc.frequency.value=frecuencia*multiplicador;ganancia.gain.setValueAtTime(.0001,inicio);ganancia.gain.exponentialRampToValueAtTime(volumen,inicio+.025);ganancia.gain.exponentialRampToValueAtTime(.0001,inicio+1.05);osc.connect(ganancia);ganancia.connect(maestro);
        const nodo={osc,ganancia};nodosAudio.add(nodo);osc.onended=()=>{nodosAudio.delete(nodo);osc.disconnect();ganancia.disconnect();};osc.start(inicio);osc.stop(inicio+1.10);
      }
      notaAudio++;proximaNota+=notaAudio%8===0?.88:.46;
    }
  }
  function destinoPara(m){
    castillo.updateWorldMatrix(true,false);
    const pos=m==='arena'?new THREE.Vector3(-10.7,12.55,-8.1):new THREE.Vector3(-9.5,12.65,-9.0),obj=m==='arena'?new THREE.Vector3(-14.9,11.98,-8.96):new THREE.Vector3(-13.45,12.14,-9.05);
    castillo.localToWorld(pos);castillo.localToWorld(obj);const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos,obj,camara.up));
    if(camara.parent){camara.parent.updateWorldMatrix(true,false);camara.parent.worldToLocal(pos);q.premultiply(camara.parent.getWorldQuaternion(new THREE.Quaternion()).invert());}
    return{posicion:pos,quaternion:q};
  }
  function enfocar(m){origenVista={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};destinoVista=destinoPara(m);tiempoVista=0;}
  function restaurarCamara(){if(recuerdoCamara){camara.position.copy(recuerdoCamara.posicion);camara.quaternion.copy(recuerdoCamara.quaternion);}recuerdoCamara=origenVista=destinoVista=null;}
  function interfaz(){
    if(liberado)return;
    titulo.textContent=modo==='arena'?'El tiempo también merece una pausa':modo==='mensaje'?'Una última pausa':'La flor de las pequeñas maravillas';
    panel.querySelectorAll('[data-modo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modo===modo)));
    panel.querySelector('.em-caja-controles').hidden=modo!=='caja';panel.querySelector('.em-arena-controles').hidden=modo!=='arena';mensaje.hidden=modo!=='mensaje';
    cajaBtn.textContent=objetivoCaja?'Cerrar cajita':'Abrir cajita';audioBtn.textContent=audioPreparando?'Preparando audio…':audioActivo?'Silenciar melodía':'Activar melodía';girarBtn.disabled=Boolean(giroArena);
    estado.textContent=avisoAudio||(modo==='arena'?(giroArena?'El reloj gira…':arenaActiva?'La arena cae sin prisa. Puedes darle la vuelta cuando quieras.':'Dale la vuelta al reloj para ver caer la arena.'):modo==='mensaje'?'Este rincón no guarda mensajes ni registra tus visitas.':objetivoCaja?'Que siempre te quede algo pequeño capaz de asombrarte.':'Abre la cajita y deja que aparezca una pequeña sorpresa.');
  }
  function cambiarModo(m){if(!['caja','arena','mensaje'].includes(m))return;modo=m;avisoAudio='';enfocar(m);interfaz();}
  function abrir(m=null){
    if(liberado||!dentro||(!cercaCaja&&!cercaArena)||abierto)return;
    modo=m==='arena'?'arena':'caja';abierto=true;recuerdoCamara={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};controles?.pausar?.();if(document.pointerLockElement){try{const p=document.exitPointerLock();p?.catch?.(()=>{});}catch{}}
    panel.hidden=false;abrirBtn.hidden=true;if(menu)menu.hidden=true;enfocar(modo);interfaz();cerrarBtn.focus();
  }
  function cerrar(){
    if(!abierto){silenciar();return;}silenciar();restaurarCamara();abierto=false;panel.hidden=true;
    if(menu){menu.hidden=false;document.getElementById('boton-iniciar')?.focus();}
  }
  function girarArena(){if(liberado||giroArena)return;giroArena={t:0,fraccionInicial:fraccionArena};arenaActiva=false;interfaz();}
  function representarArena(){
    const arriba=Math.cbrt(Math.max(0,1-fraccionArena)),abajo=Math.cbrt(Math.max(0,fraccionArena));
    arenaArriba.scale.set(Math.max(.0001,arriba),Math.max(.0001,arriba),Math.max(.0001,arriba));arenaArriba.position.y=.55+.20*arriba;
    arenaAbajo.scale.set(Math.max(.0001,abajo),Math.max(.0001,abajo),Math.max(.0001,abajo));arenaAbajo.position.y=.13+.20*abajo;
    const fondo=.13+.4*abajo,longitud=Math.max(.015,.54-fondo);hilo.position.y=(.54+fondo)/2;hilo.scale.y=arenaActiva&&!giroArena?longitud/.36:.0001;
    if(abierto&&modo==='arena')tiempoArena.textContent=giroArena?'':arenaActiva?`${Math.ceil((1-fraccionArena)*duracionArena)} s de esta vuelta`:'En reposo';
  }
  function actualizarReloj(){const fecha=new Date(),seg=fecha.getSeconds(),min=fecha.getMinutes(),hora=fecha.getHours()%12;agujas[0].rotation.z=-(hora+min/60)*Math.PI/6;agujas[1].rotation.z=-(min+seg/60)*Math.PI/30;agujas[2].rotation.z=-seg*Math.PI/30;}
  function teclado(e){
    if(abierto){
      if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
      if(e.code==='Tab'){const lista=[...panel.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length),primero=lista[0],ultimo=lista[lista.length-1];if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}}
      if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','KeyG','Space'].includes(e.code))e.stopImmediatePropagation();return;
    }
    if(e.code==='KeyR'&&!e.repeat&&dentro&&(cercaCaja||cercaArena)&&!Boolean(menu&&!menu.hidden)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();e.stopImmediatePropagation();abrir(cercaArena&&!cercaCaja?'arena':'caja');}
  }
  const raycaster=new THREE.Raycaster(),centro=new THREE.Vector2();
  function clicMundo(){if(!dentro||abierto||document.pointerLockElement!==elemento)return;raycaster.setFromCamera(centro,camara);const hit=raycaster.intersectObjects([cajita,arenaBase],true)[0];if(!hit||hit.distance>7)return;let o=hit.object;while(o&&o!==cajita&&o!==arenaBase)o=o.parent;abrir(o===arenaBase?'arena':'caja');}
  function alDesbloquear(){if(abierto&&menu)menu.hidden=true;}
  function alOcultar(){if(document.hidden)cerrar();}
  cerrarBtn.addEventListener('click',cerrar);abrirBtn.addEventListener('click',()=>abrir(cercaArena&&!cercaCaja?'arena':'caja'));
  cajaBtn.addEventListener('click',()=>{objetivoCaja=!objetivoCaja;if(!objetivoCaja)silenciar();avisoAudio='';interfaz();});audioBtn.addEventListener('click',alternarAudio);girarBtn.addEventListener('click',girarArena);
  panel.querySelectorAll('[data-modo]').forEach(b=>b.addEventListener('click',()=>cambiarModo(b.dataset.modo)));
  document.addEventListener('keydown',teclado,true);document.addEventListener('pointerlockchange',alDesbloquear);document.addEventListener('visibilitychange',alOcultar);window.addEventListener('pagehide',cerrar);elemento.addEventListener('click',clicMundo);
  representarArena();actualizarReloj();
  const objetivoCercania0=new THREE.Vector3(-13.45,12.0,-9.05);
  const objetivoCercania1=new THREE.Vector3(-14.9,12.0,-8.96);
  function actualizar(dt=0){
    if(liberado)return;const paso=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));reloj+=paso;
    castillo.updateWorldMatrix(true,false);camara.getWorldPosition(localCam);castillo.worldToLocal(localCam);
    dentro=localCam.x> -19.7&&localCam.x< -7.3&&localCam.z> -17.7&&localCam.z< -2.3&&localCam.y>10&&localCam.y<16.95;
    cercaCaja=dentro&&localCam.distanceTo(objetivoCercania0)<4.4;cercaArena=dentro&&localCam.distanceTo(objetivoCercania1)<4.4;
    const visible=oclusion?.habitaciones?.find(h=>h.id===ROOM)?.visible??true;raiz.visible=visible;luz.visible=visible;abrirBtn.hidden=!dentro||(!cercaCaja&&!cercaArena)||abierto||Boolean(menu&&!menu.hidden);
    apertura=reducido?(objetivoCaja?1:0):THREE.MathUtils.damp(apertura,objetivoCaja?1:0,4,paso);bisagra.rotation.x=-1.64*apertura;
    const crecer=THREE.MathUtils.smoothstep(apertura,.15,.85);flor.position.y=.13+.35*crecer;flor.scale.setScalar(.22+.78*crecer);
    petalos.forEach(p=>p.grupo.rotation.x=.06+crecer*(p.interior ? .92:1.23));centroFlorMat.emissiveIntensity=.2+crecer*1.5;fulgorMat.opacity=crecer*.68;pm.opacity=crecer*.8;
    if(visible){
      pendulo.rotation.z=reducido?0:Math.sin(reloj*2.2)*.15;engranaje.rotation.y+=reducido?0:paso*.38*crecer;
      const a=pg.attributes.position.array;semillas.forEach((s,i)=>{const ang=s.a+(reducido?0:reloj*.4);a[i*3]=Math.cos(ang)*s.r;a[i*3+1]=.45+((s.y+(reducido?0:reloj*.13))%1)*1.1;a[i*3+2]=Math.sin(ang)*s.r;});pg.attributes.position.needsUpdate=true;
      pluma.rotation.z=-.35+(reducido?0:Math.sin(reloj*.8)*.025);
    }
    if(Math.floor(reloj)!==segundoAnterior){segundoAnterior=Math.floor(reloj);actualizarReloj();}
    if(giroArena){giroArena.t+=paso;const p=Math.min(1,giroArena.t/(reducido ? .05:1.15)),s=p*p*(3-2*p);arenaGiro.rotation.z=Math.PI*s;if(p===1){fraccionArena=1-giroArena.fraccionInicial;arenaGiro.rotation.z=0;giroArena=null;arenaActiva=fraccionArena<.999;if(abierto)interfaz();}}
    else if(arenaActiva){fraccionArena=Math.min(1,fraccionArena+paso/duracionArena);if(fraccionArena===1){arenaActiva=false;if(abierto)interfaz();}}
    representarArena();
    if(abierto&&origenVista&&destinoVista){tiempoVista+=paso;const p=Math.min(1,tiempoVista/(reducido ? .05:1.1)),s=p*p*(3-2*p);camara.position.lerpVectors(origenVista.posicion,destinoVista.posicion,s);camara.quaternion.slerpQuaternions(origenVista.quaternion,destinoVista.quaternion,s);if(p===1)origenVista=destinoVista=null;}
    if(abierto&&!dentro)cerrar();if(abierto&&menu&&!menu.hidden)menu.hidden=true;
    if(!dentro&&audioActivo)silenciar();programarSonido();
  }
  const api={raiz,cajita,arenaBase,actualizar,abrir,cerrar,girarArena,
    vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get abierto(){return abierto;},get cajaAbierta(){return objetivoCaja;},
    liberar(){
      if(liberado)return;cerrar();liberado=true;silenciar();if(contextoAudio&&contextoAudio.state!=='closed')contextoAudio.close().catch(()=>{});
      document.removeEventListener('keydown',teclado,true);document.removeEventListener('pointerlockchange',alDesbloquear);document.removeEventListener('visibilitychange',alOcultar);window.removeEventListener('pagehide',cerrar);elemento.removeEventListener('click',clicMundo);
      panel.remove();abrirBtn.remove();estilo.remove();raiz.removeFromParent();
      if(Array.isArray(colisiones)){for(const r of propios){const i=colisiones.indexOf(r);if(i>=0)colisiones.splice(i,1);}retirados.sort((a,b)=>a.indice-b.indice).forEach(r=>colisiones.splice(Math.min(r.indice,colisiones.length),0,r.valor));}
      ocultos.forEach(r=>r.objeto.visible=r.visible);for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();delete castillo.userData.estudioMaravillas;
    }
  };castillo.userData.estudioMaravillas=api;return api;
}

exports.MELODIA_ESTUDIO = MELODIA_ESTUDIO;
exports.MENSAJE_ESTUDIO = MENSAJE_ESTUDIO;
exports.crearEstudioMaravillas = crearEstudioMaravillas;
},
"./cicloDiaNoche.js": function(module, exports, __require) {
const THREE = __THREE;


function crearCicloDiaNoche(escena) {
  const sol=escena.getObjectByName('Sol principal');
  if(!sol)throw new Error('Se requiere escena.js del paquete de renderizado dinamico.');
  const ambiente=escena.children.find(o=>o.isHemisphereLight);
  const luna=new THREE.DirectionalLight(0x9fb7ff,0);luna.name='Luz de luna';luna.castShadow=false;
  luna.target.position.set(0,16,-18);escena.add(luna,luna.target);
  const ajustes={duracionSegundos:360,hora:10,pausado:false};
  const noche=new THREE.Color(0x101c35),dia=new THREE.Color(0xb9d8eb),ocaso=new THREE.Color(0xc88e79);
  const blanco=new THREE.Color(0xffedcf),calido=new THREE.Color(0xffaa6b),cielo=new THREE.Color();
  function actualizar(dt) {
    if(!ajustes.pausado)ajustes.hora=(ajustes.hora+dt*24/Math.max(30,ajustes.duracionSegundos))%24;
    const a=(ajustes.hora-6)/24*Math.PI*2,h=Math.sin(a);
    const claridad=THREE.MathUtils.smoothstep(h,-0.12,0.25);
    sol.position.set(Math.cos(a)*80,16+h*100,-18+Math.cos(a)*35);
    sol.target.position.set(0,16,-18);
    sol.intensity=2.2*THREE.MathUtils.smoothstep(h,0,0.3);
    sol.color.copy(calido).lerp(blanco,THREE.MathUtils.smoothstep(h,0.05,0.55));
    // La luna no usa otro mapa de sombras.
    luna.position.set(-Math.cos(a)*80,16-h*100,-18-Math.cos(a)*35);
    luna.intensity=0.22*(1-claridad);
    if(ambiente)ambiente.intensity=THREE.MathUtils.lerp(0.22,0.65,claridad);
    cielo.copy(noche).lerp(dia,claridad);
    const atardecer=(1-THREE.MathUtils.smoothstep(Math.abs(h),0,0.25))*0.35;
    cielo.lerp(ocaso,atardecer);
    escena.background.copy(cielo);if(escena.fog)escena.fog.color.copy(cielo);
  }
  actualizar(0);
  return {actualizar,ajustes};
}

exports.crearCicloDiaNoche = crearCicloDiaNoche;
},
"./renderizadoDinamico.js": function(module, exports, __require) {
const THREE = __THREE;


// Para el castillo jugable de la conversacion. No modifica sus colisiones.
function crearRenderizadoDinamico(escena,camara,renderizador,castillo) {
  const frustum=new THREE.Frustum(),matriz=new THREE.Matrix4();
  const caja=new THREE.Box3(),esfera=new THREE.Sphere();
  const decoraciones=[],fuentes=[],originales=[];
  const anisotropia=Math.min(8,renderizador.capabilities.getMaxAnisotropy());
  const texturas=new Set();
  escena.updateMatrixWorld(true);
  escena.traverse(o=>{
    if(!o.isMesh)return;
    // El motor decide el descarte en cada pase, incluida la camara de sombras.
    o.frustumCulled=true;
    const lista=Array.isArray(o.material)?o.material:[o.material];
    for(const m of lista) {
      if(!m)continue;
      m.dithering=true;
      for(const t of [m.map,m.bumpMap,m.normalMap,m.roughnessMap]) {
        if(!t||texturas.has(t))continue;
        texturas.add(t);t.anisotropy=anisotropia;t.needsUpdate=true;
      }
      if(/alfombra/i.test(o.name)) {
        m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;
      }
      m.needsUpdate=true;
    }
    // Nunca ocultar paredes, pisos, puertas o emisores de sombras.
    // Opt-in para adornos que el autor haya marcado expresamente.
    if(o.userData.detalleDinamico===true&&!o.castShadow) {
      caja.setFromObject(o);caja.getBoundingSphere(esfera);
      decoraciones.push({objeto:o,visible:o.visible,esfera:esfera.clone(),matriz:o.matrixWorld.clone()});
    }
  });
  castillo.traverse(o=>{
    if(!o.isPointLight)return;
    const posicion=new THREE.Vector3();o.getWorldPosition(posicion);
    fuentes.push({posicion,color:o.color.clone(),intensidad:o.intensity,distancia:o.distance,decay:o.decay});
    originales.push({luz:o,visible:o.visible});o.visible=false;
  });
  // Pool fijo: evita variar el numero de luces del shader al girar la camara.
  const cantidad=Math.min(4,fuentes.length),slots=[];
  for(let i=0;i<cantidad;i++) {
    const luz=new THREE.PointLight(0xffffff,0,20,2);
    luz.name='Luz interior dinamica '+i;luz.castShadow=false;escena.add(luz);
    slots.push({luz,fuente:null});
  }
  let indicesDeseados=[];
  let reloj=1;
  const posicion=new THREE.Vector3();
  const metricas={dibujadas:0,triangulos:0,lucesInteriores:cantidad};
  function seleccionar() {
    const activos=new Set(slots.map(s=>s.fuente));
    indicesDeseados=fuentes.map((f,i)=>({i,d:f.posicion.distanceTo(camara.position)*(activos.has(i)?0.85:1)}))
      .filter(x=>x.d<32).sort((a,b)=>a.d-b.d).slice(0,cantidad).map(x=>x.i);
  }
  function actualizar(dt) {
    camara.updateMatrixWorld();
    matriz.multiplyMatrices(camara.projectionMatrix,camara.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matriz);
    for(const d of decoraciones) {
      d.objeto.updateWorldMatrix(true,false);
      if(!d.matriz.equals(d.objeto.matrixWorld)){
        caja.setFromObject(d.objeto);caja.getBoundingSphere(d.esfera);d.matriz.copy(d.objeto.matrixWorld);
      }
      esfera.copy(d.esfera);esfera.radius+=.7;
      posicion.copy(esfera.center);
      d.objeto.visible=d.visible&&(posicion.distanceTo(camara.position)<18||
        (posicion.distanceTo(camara.position)<75&&frustum.intersectsSphere(esfera)));
    }
    reloj+=dt;
    if(reloj>0.25){reloj=0;seleccionar();}
    const reservados=new Set(slots.filter(s=>indicesDeseados.includes(s.fuente)).map(s=>s.fuente));
    for(const s of slots) {
      const mantener=indicesDeseados.includes(s.fuente);
      const fuente=mantener?fuentes[s.fuente]:null;
      let objetivo=0;
      if(fuente) {
        const d=fuente.posicion.distanceTo(camara.position);
        objetivo=fuente.intensidad*(1-THREE.MathUtils.smoothstep(d,22,32));
      }
      s.luz.intensity=THREE.MathUtils.damp(s.luz.intensity,objetivo,8,dt);
      if(!mantener&&s.luz.intensity<0.03) {
        s.luz.intensity=0;
        const nuevo=indicesDeseados.find(i=>!reservados.has(i));
        s.fuente=nuevo??null;
        if(nuevo!==undefined) {
          reservados.add(nuevo);const f=fuentes[nuevo];
          s.luz.position.copy(f.posicion);s.luz.color.copy(f.color);
          s.luz.distance=f.distancia;s.luz.decay=f.decay;
        }
      }
    }
  }
  function registrarMetricas() {
    metricas.dibujadas=renderizador.info.render.calls;
    metricas.triangulos=renderizador.info.render.triangles;
  }
  function liberar() {
    for(const s of slots){escena.remove(s.luz);s.luz.dispose?.();}
    for(const o of originales)o.luz.visible=o.visible;
    for(const d of decoraciones)d.objeto.visible=d.visible;
  }
  return {actualizar,registrarMetricas,metricas,liberar};
}

exports.crearRenderizadoDinamico = crearRenderizadoDinamico;
},
"./pasoExteriorTercerPiso.js": function(module, exports, __require) {
const THREE = __THREE;


// Tras reconstruirLosaCompleta, antes de luces dinamicas, portales y agrupacion.
function abrirPasoExteriorTercerPiso(castillo) {
  const cuerpo=castillo.getObjectByName('Cuerpo frontal superior');
  if(!cuerpo)throw new Error('No se encuentra el cuerpo frontal de la ampliacion superior.');
  const colisiones=castillo.userData.colisiones,puertas=castillo.userData.puertas;
  const basePiedra=Array.isArray(cuerpo.material)?cuerpo.material:[cuerpo.material];
  const raiz=new THREE.Group();raiz.name='Pabellon frontal transitable';castillo.add(raiz);
  const geo=new THREE.BoxGeometry(1,1,1);
  const hierro=new THREE.MeshStandardMaterial({color:0x34382f,roughness:0.7,metalness:0.55});
  const madera=new THREE.MeshStandardMaterial({color:0x6e472a,roughness:0.9});
  const dorado=new THREE.MeshStandardMaterial({color:0xc7a05a,metalness:0.6,roughness:0.45});
  const llama=new THREE.MeshStandardMaterial({color:0xffdb82,emissive:0xff9f39,emissiveIntensity:2});
  function quitar(o){for(let i=colisiones.length-1;i>=0;i--)if(colisiones[i].mesh===o)colisiones.splice(i,1);o.removeFromParent();}
  quitar(cuerpo);
  function materiales(w,h,d) {
    return [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]].map(([u,v],i)=>{
      const m=basePiedra[i%basePiedra.length].clone();
      for(const key of ['map','bumpMap'])if(m[key]){m[key]=m[key].clone();m[key].repeat.set(Math.max(0.15,u/4),Math.max(0.15,v/4));m[key].needsUpdate=true;}
      return m;
    });
  }
  function caja(nombre,x,y,z,w,h,d,mat=null,colision=false) {
    const o=new THREE.Mesh(geo,mat||materiales(w,h,d));o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;raiz.add(o);
    if(colision)colisiones.push({mesh:o,w,h,d,esCaja:true});return o;
  }
  // Retira la baranda que cortaba el camino delante de la casa.
  castillo.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),p=new THREE.Vector3(),retirar=[];
  castillo.traverse(o=>{
    if(o===raiz)return;
    o.getWorldPosition(p).applyMatrix4(inv);
    if(o.isMesh&&['Colision baranda terraza','Pasamanos terraza','Balaustre terraza'].includes(o.name)&&Math.abs(p.z-4)<0.04)retirar.push(o);
    if(o.isMesh&&o.name==='Pilastra frontal superior'&&Math.abs(p.x)<1.4)retirar.push(o);
    // Una ventana decorativa del bloque anterior coincidia con el nuevo vano.
    if(o.isGroup&&o.children.length===3&&Math.abs(p.x)<1.6&&p.z>11&&p.z<11.4&&p.y>17.5&&p.y<21.3)retirar.push(o);
  });
  for(const o of new Set(retirar))quitar(o);
  const nivel=17.5;
  // Misma cubierta y cornisas exteriores: ahora el cuerpo es una envolvente hueca.
  caja('Pared pabellon oeste',-10.85,21,8,0.3,7,6,null,true);
  caja('Pared pabellon este',10.85,21,8,0.3,7,6,null,true);
  function paredConPuerta(z,nombre) {
    for(const s of [-1,1])caja('Pared '+nombre,s*6.15,21,z,9.7,7,0.3,null,true);
    caja('Dintel '+nombre,0,22.8,z,2.6,3.4,0.3,null,true);
    const marco=new THREE.Group();marco.position.set(0,nivel,z);raiz.add(marco);
    const pivote=new THREE.Group();pivote.position.x=-1.3;marco.add(pivote);
    const hoja=new THREE.Mesh(geo,madera);hoja.scale.set(2.6,3.6,0.22);hoja.position.set(1.3,1.8,0);hoja.name=nombre;pivote.add(hoja);
    colisiones.push({mesh:hoja,w:2.6,h:3.6,d:0.22,esCaja:true});
    for(const y of [0.5,3.1]){const b=new THREE.Mesh(geo,hierro);b.scale.set(2.45,0.14,0.28);b.position.set(1.3,y,0);pivote.add(b);}
    const pomo=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),dorado);pomo.position.set(2.34,1.65,0.23);pivote.add(pomo);
    for(const x of [-1.43,1.43])caja('Marco '+nombre,x,19.35,z,0.23,3.9,0.5,null,false);
    caja('Marco superior '+nombre,0,21.25,z,3.1,0.25,0.5);
    puertas.push({nombre,marco,pivote,hoja,ancho:2.6,alto:3.6,abierta:false,angulo:0});
  }
  paredConPuerta(5,'Entrada pabellon frontal');
  paredConPuerta(11,'Salida pabellon frontal');
  function baranda(x,z,w,d) {
    const b=caja('Colision baranda pabellon',x,18.05,z,w,1.1,d,hierro,true);b.visible=false;
    caja('Pasamanos pabellon',x,18.6,z,w,0.1,d,hierro);
    const l=Math.max(w,d),n=Math.ceil(l/0.8);
    for(let i=0;i<=n;i++)caja('Balaustre pabellon',x+(w>d?-l/2+i*l/n:0),18.02,z+(d>w?-l/2+i*l/n:0),0.07,1.04,0.07,hierro);
  }
  // Paso central abierto en la antigua baranda; conserva proteccion a ambos lados.
  baranda(-3,4,3,0.16);baranda(3,4,3,0.16);
  baranda(-1.6,4.5,0.12,1);baranda(1.6,4.5,0.12,1);
  // Balcon exterior despues de atravesar el pabellon, sobre la losa existente.
  baranda(0,17.3,21,0.16);baranda(-10.5,14.15,0.16,6.3);baranda(10.5,14.15,0.16,6.3);
  // No agrega otro plano coplanar: reutiliza la losa continua del piso 3.
  const sueloAnterior=castillo.userData.alturaSuelo;
  castillo.userData.alturaSuelo=(x,z,pies)=>{
    let h=sueloAnterior(x,z,pies);
    const lx=x-castillo.position.x,lz=z-castillo.position.z;
    if(Math.abs(lx)<=10.7&&lz>=4&&lz<=17.4&&pies-castillo.position.y+0.32>=nivel)h=Math.max(h,nivel+castillo.position.y);
    return h;
  };
  // Luminarias visibles, capturadas por el pool existente de luces interiores.
  for(const z of [6,10]) {
    for(const x of [-2,2]){
      caja('Soporte antorcha pabellon',x,20,z,0.12,0.8,0.12,madera);
      const f=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.4,6),llama);f.position.set(x,20.55,z);raiz.add(f);
    }
    const l=new THREE.PointLight(0xffc878,110,15,2);l.position.set(0,20.8,z);raiz.add(l);
  }
  return {entradaZ:5,salidaZ:11,piso:nivel,balconHastaZ:17.3};
}

exports.abrirPasoExteriorTercerPiso = abrirPasoExteriorTercerPiso;
},
"./agruparEstructura.js": function(module, exports, __require) {
const THREE = __THREE;


// Fusion por material y sector; bake de repeticion UV para compartir materiales.
function agruparEstructura(castillo) {
  castillo.updateMatrixWorld(true);
  const excluir=new Set();
  for(const p of castillo.userData.puertas||[])p.marco.traverse(o=>excluir.add(o));
  const contenidos=/^(Mesa|Armario|Estanteria|Libros|Cama|Cabecera)(\s|$)/i;
  const imagenes=new WeakMap();let siguiente=0;
  const idImagen=t=>{if(!t)return '-';const im=t.image;if(!im||typeof im!=='object')return t.uuid;if(!imagenes.has(im))imagenes.set(im,++siguiente);return imagenes.get(im);};
  const firma=m=>[m.type,m.color?.getHex(),m.roughness,m.metalness,m.side,m.bumpScale,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.dithering,
    idImagen(m.map),idImagen(m.bumpMap),m.map?.wrapS,m.map?.wrapT].join(':');
  const lotes=new Map(),materiales=new Map(),noIndex=new Map(),ocultados=[];
  const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),transform=new THREE.Matrix4(),normal=new THREE.Matrix3();
  const v=new THREE.Vector3(),n=new THREE.Vector3(),centro=new THREE.Vector3();
  let llamadasOriginales=0;
  function elegible(o) {
    if(!o.isMesh||o.isInstancedMesh||o.children.length||!o.visible||excluir.has(o)||contenidos.test(o.name)||o.userData.habitacion)return false;
    for(let p=o.parent;p;p=p.parent)if(!p.visible||p.userData.occlusionGate)return false;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    return ms.every(m=>m&&m.isMeshStandardMaterial&&!m.transparent&&!m.vertexColors&&!(m.emissive&&(m.emissive.r>0||m.emissive.g>0||m.emissive.b>0))&&!m.normalMap&&!m.aoMap&&!m.alphaMap&&
      (!m.map||!m.map.rotation)&&(!m.bumpMap||!m.map||(m.bumpMap.repeat.equals(m.map.repeat)&&m.bumpMap.offset.equals(m.map.offset))));
  }
  const fuentes=[];castillo.traverse(o=>{if(elegible(o))fuentes.push(o);});
  for(const o of fuentes) {
    let g=noIndex.get(o.geometry);
    if(!g){g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();noIndex.set(o.geometry,g);}
    if(!g.attributes.normal||!g.attributes.uv)continue;
    transform.multiplyMatrices(inv,o.matrixWorld);normal.getNormalMatrix(transform);
    o.getWorldPosition(centro).applyMatrix4(inv);
    const sector=`${Math.floor(centro.x/10)},${Math.floor(centro.y/7)},${Math.floor(centro.z/10)}`;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    const grupos=Array.isArray(o.material)?g.groups:[{start:0,count:g.attributes.position.count,materialIndex:0}];
    if(!grupos.length)continue;
    for(const grupo of grupos) {
      const m=ms[grupo.materialIndex||0],f=firma(m),key=sector+':'+f+':'+o.castShadow+':'+o.receiveShadow;
      if(!materiales.has(f)){
        const nuevo=m.clone();
        for(const campo of ['map','bumpMap'])if(nuevo[campo]){nuevo[campo]=nuevo[campo].clone();nuevo[campo].repeat.set(1,1);nuevo[campo].offset.set(0,0);nuevo[campo].needsUpdate=true;}
        materiales.set(f,nuevo);
      }
      if(!lotes.has(key))lotes.set(key,{p:[],n:[],uv:[],material:materiales.get(f),cast:o.castShadow,receive:o.receiveShadow});
      const b=lotes.get(key),t=m.map||m.bumpMap;
      for(let i=grupo.start;i<grupo.start+grupo.count;i++){
        v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(transform);n.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(normal).normalize();
        b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);
        b.uv.push(g.attributes.uv.getX(i)*(t?.repeat.x??1)+(t?.offset.x??0),g.attributes.uv.getY(i)*(t?.repeat.y??1)+(t?.offset.y??0));
      }
      llamadasOriginales++;
    }
    o.visible=false;ocultados.push(o);
  }
  const grupo=new THREE.Group();grupo.name='Estructura agrupada por sectores';castillo.add(grupo);
  for(const b of lotes.values()){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();g.computeBoundingBox();
    const o=new THREE.Mesh(g,b.material);o.castShadow=b.cast;o.receiveShadow=b.receive;grupo.add(o);
  }
  for(const g of noIndex.values())g.dispose();
  return {mallasOriginales:ocultados.length,gruposOriginales:llamadasOriginales,lotesNuevos:lotes.size,
    nota:'Conteos de geometria agrupada; no son mediciones de draw calls de un fotograma.'};
}

exports.agruparEstructura = agruparEstructura;
},
"./main.js": function(module, exports, __require) {
const { crearEstudioMaravillas } = __require("./estudioMaravillas.js");
const { crearSalaDeseosHogar } = __require("./salaDeseosHogar.js");
const { crearObservatorioDeseos } = __require("./observatorioDeseos.js");
const { crearSalaMapasGaleria } = __require("./salaMapasGaleria.js");
const { crearSalaConsejoPoetica } = __require("./salaConsejoPoetica.js");
const { crearBoticarioArmeria } = __require("./boticarioArmeria.js");
const { crearEscena } = __require("./escena.js");
const { crearPiso } = __require("./piso.js");
const { crearControles } = __require("./controles.js");
const { crearCastillo } = __require("./castillo.js");
const {
  crearRenderizadoDinamico
} = __require("./renderizadoDinamico.js");
const {
  crearOclusionHabitaciones
} = __require("./oclusionHabitaciones.js");
const {
  corregirPisosEIluminacion
} = __require("./correccionesCastillo.js");
const { crearEntornoMontana } = __require("./entornoMontana.js");
const { crearCicloDiaNoche } = __require("./cicloDiaNoche.js");
const { crearAmbienteAvanzado } = __require("./ambienteAvanzado.js");
const { ampliarParteSuperior } = __require("./ampliacionSuperior.js");
const { agruparEstructura } = __require("./agruparEstructura.js");
const {
  crearMonitorRendimiento
} = __require("./monitorRendimiento.js");
const { crearAccesosTresPisos } = __require("./accesosTresPisos.js");
const { corregirTechoYTerraza } = __require("./techoYTerraza.js");
const {
  reconstruirLosaCompleta
} = __require("./reconstruirLosaCompleta.js");
const {
  abrirPasoExteriorTercerPiso
} = __require("./pasoExteriorTercerPiso.js");
const {
  despejarEscaleraYSalida
} = __require("./despejarEscaleraYSalida.js");
const {
  quitarBarandasTercerPiso
} = __require("./quitarBarandasTercerPiso.js");
const { configurarInicioLejano } = __require("./inicioLejano.js");
const {
  crearSalaBibliotecaVideo
} = __require("./salaBibliotecaVideo.js");
const {
  crearComedorRompecabezas
} = __require("./comedorRompecabezas.js");

// ESTUDIO_MARAVILLAS_INTEGRADO

// SALA_DESEOS_HOGAR_INTEGRADA

// OBSERVATORIO_DESEOS_INTEGRADO

// SALA_MAPAS_GALERIA_INTEGRADA

// CONSEJO_POETICO_INTEGRADO

// BOTICARIO_ARMERIA_INTEGRADO





































// =============================================================
// 01. RUTAS DE LOS RECURSOS
//
// Estructura esperada:
// index.html
// assets/
//   videos/
//   imagen/rompecabezas/
//
// Se calculan desde el HTML, no desde la carpeta js.
// =============================================================

const carpetaAssets = new URL(
  './assets/',
  document.baseURI
);

const carpetaVideos = new URL(
  'videos/',
  carpetaAssets
);

const carpetaRompecabezas = new URL(
  'imagen/rompecabezas/',
  carpetaAssets
);

function videoURL(nombreArchivo) {
  return new URL(
    nombreArchivo,
    carpetaVideos
  ).href;
}

// =============================================================
// 02. ESCENA Y TERRENO
// =============================================================

const {
  escena,
  camara,
  renderizador
} = crearEscena(
  document.getElementById('contenedor')
);

crearPiso(escena);

const castillo = crearCastillo(escena);

// =============================================================
// 03. CONSTRUCCIÓN Y CORRECCIONES DEL CASTILLO
// =============================================================

ampliarParteSuperior(castillo);

const correcciones = corregirPisosEIluminacion(
  escena,
  camara,
  castillo
);

const entorno = crearEntornoMontana(
  escena,
  camara,
  castillo
);

crearAccesosTresPisos(castillo);

corregirTechoYTerraza(castillo);

window.reparacionLosa = reconstruirLosaCompleta(
  castillo
);

window.pasoExteriorTercerPiso =
  abrirPasoExteriorTercerPiso(castillo);

window.despejeCastillo =
  despejarEscaleraYSalida(castillo);

window.barandasTercerPiso =
  quitarBarandasTercerPiso(castillo);

// =============================================================
// 04. BIBLIOTECA: VÍDEOS, COLORES Y FOCOS
// =============================================================

const sala = crearSalaBibliotecaVideo(
  escena,
  camara,
  castillo,
  {
    separacionFocos: 0.7,
    halosFocos: true,

    // Color predeterminado para canciones sin color propio.
    colorFocos: 0xffd39a,

    videos: [
      {
        titulo: 'Los Niches — QUE NUNCA ME FALTE ',
        src: videoURL('QUE NUNCA ME FALTE.mp4'),
        colorFocos: 0xffc247 // Dorado cálido.
      },
      {
        titulo: 'Rata Blanca - Mujer Amante',
        src: videoURL('Rata Blanca.mp4'),
        colorFocos: 0xff385c // Rojo carmesí.
      },
      {
        titulo: 'Juan Gabriel - Abrázame Muy Fuerte',
        src: videoURL('Abrazame Muy Fuerte.mp4'),
        colorFocos: 0xff80b5 // Rosa.
      },
      {
        titulo: 'Lasso - Hasta Ese Día',
        src: videoURL('Hasta Ese Día.mp4'),
        colorFocos: 0x48dfff // Cian.
      },
      {
        titulo: 'Melendi - La promesa',
        src: videoURL('La promesa.mp4'),
        colorFocos: 0xa77bff // Violeta.
      },
      {
        titulo: 'Andrés Cepeda - Lo Mejor Que Hay en Mi Vida',
        src: videoURL('Lo Mejor Que Hay en Mi Vida.mp4'),
        colorFocos: 0xff8a38 // Naranja.
      },
      {
        titulo: 'Juan Luis Guerra - Mi Bendicion',
        src: videoURL('Mi Bendicion.mp4'),
        colorFocos: 0x60ef9b // Verde menta.
      },
      {
        titulo: 'Marc Anthony - Tu Amor Me Hace Bien',
        src: videoURL('Tu Amor Me Hace Bien.mp4'),
        colorFocos: 0xf0ec55 // Amarillo lima.
      },
      {
        titulo: 'Andrés Cepeda, Reik - Tu Despertador',
        src: videoURL('Tu Despertador.mp4'),
        colorFocos: 0x538aff // Azul.
      }
    ]
  }
);

window.bibliotecaVideo = sala;

// =============================================================
// 05. COMEDOR: ROMPECABEZAS PERSONALIZADOS
// =============================================================

const comedor = crearComedorRompecabezas(
  escena,
  camara,
  castillo,
  renderizador.domElement,
  {
    carpetaImagenes: carpetaRompecabezas.href
  }
);

window.comedorRompecabezas = comedor;

// =============================================================
// 06. ARMERÍA: BOTICARIO
// =============================================================

const boticario = crearBoticarioArmeria(
  escena,
  camara,
  castillo,
  renderizador.domElement
);

window.boticarioArmeria = boticario;

// =============================================================
// 07. POSICIÓN INICIAL Y CICLO DE DÍA/NOCHE
// =============================================================

window.inicioJugador = configurarInicioLejano(
  camara,
  castillo
);

const ciclo = crearCicloDiaNoche(escena);

// =============================================================
// 08. CONTROLES Y VINCULACIÓN DE HABITACIONES
// =============================================================

const consejoPoetico = crearSalaConsejoPoetica(
  escena,
  camara,
  castillo,
  renderizador.domElement
);
window.bibliotecaConsejo = consejoPoetico;

const galeriaMapas = crearSalaMapasGaleria(
  escena,
  camara,
  castillo,
  renderizador.domElement
);
window.galeriaMapas = galeriaMapas;

const observatorio = crearObservatorioDeseos(
  escena,
  camara,
  castillo,
  renderizador.domElement
);
window.observatorioDeseos = observatorio;

const salaDeseos = crearSalaDeseosHogar(
  escena,
  camara,
  castillo,
  renderizador.domElement
);
window.salaDeseosHogar = salaDeseos;

const estudio = crearEstudioMaravillas(
  escena,
  camara,
  castillo,
  renderizador.domElement
);
window.estudioMaravillas = estudio;

const controles = crearControles(
  camara,
  renderizador.domElement,
  castillo.userData
);

sala.vincularControles(controles);
comedor.vincularControles(controles);
boticario.vincularControles(controles);
estudio.vincularControles(controles);
salaDeseos.vincularControles(controles);
observatorio.vincularControles(controles);
galeriaMapas.vincularControles(controles);
consejoPoetico.vincularControles(controles);

// =============================================================
// 09. RENDERIZADO DINÁMICO Y AMBIENTE
// =============================================================

const dinamico = crearRenderizadoDinamico(
  escena,
  camara,
  renderizador,
  castillo
);

const ambiente = crearAmbienteAvanzado(
  escena,
  camara,
  castillo,
  entorno,
  ciclo
);

// =============================================================
// 10. OCLUSIÓN DE HABITACIONES
// =============================================================

const oclusion = crearOclusionHabitaciones(
  escena,
  camara,
  castillo
);

sala.vincularOclusion(oclusion);
comedor.vincularOclusion(oclusion);
boticario.vincularOclusion(oclusion);
estudio.vincularOclusion(oclusion);
salaDeseos.vincularOclusion(oclusion);
observatorio.vincularOclusion(oclusion);
galeriaMapas.vincularOclusion(oclusion);
consejoPoetico.vincularOclusion(oclusion);

// =============================================================
// 11. COLISIONES Y OPTIMIZACIÓN
//
// Ejecutar después de construir y modificar las habitaciones.
// =============================================================

castillo.userData.prepararColisiones();

// Acabados por superficie: sin filtros de pantalla ni nuevas luces.
const acabadosVisitados=new Set();
castillo.traverse(o=>{
  if(!o.isMesh)return;
  const nombre=o.name.toLowerCase();
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(!m?.isMeshStandardMaterial||acabadosVisitados.has(m))continue;
    acabadosVisitados.add(m);
    if(m.transparent||m.map?.isVideoTexture)continue;
    if(/oro|dorado|laton|latón|candelabro/.test(nombre)){
      m.roughness=Math.min(m.roughness,.42);m.metalness=Math.max(m.metalness,.65);
    }else if(/madera|mesa|estanter|armario|cabecera/.test(nombre)&&m.metalness<.25){
      m.roughness=Math.min(m.roughness,.78);
    }else if(/alfombra|tela|cojin|cojín|cortina/.test(nombre)){
      m.roughness=.98;m.metalness=0;
    }
    m.dithering=true;
  }
});
window.informeAgrupacion = agruparEstructura(
  castillo
);

const rendimiento = crearMonitorRendimiento(
  escena,
  camara,
  renderizador,
  entorno
);

// =============================================================
// 12. REFERENCIAS PARA LA CONSOLA
// =============================================================

Object.assign(window, {
  rendimientoCastillo: rendimiento,
  metricasCastillo: dinamico.metricas,
  oclusionCastillo: oclusion,
  correccionesCastillo: correcciones,
  entornoCastillo: entorno,
  cicloCastillo: ciclo,
  controlesCastillo: controles
});

// =============================================================
// 13. BUCLE PRINCIPAL
// =============================================================

let anterior = null;
let relojEntorno = 0;

renderizador.setAnimationLoop(t => {
  const crudo = anterior === null
    ? 1 / 60
    : (t - anterior) / 1000;

  const dt = Math.min(crudo, 0.05);

  anterior = t;

  const inicio = performance.now();

  // Movimiento y presentación general.
  controles.actualizar(dt);
  correcciones.actualizar(dt);
  ciclo.actualizar(dt);

  // Restaurar la intensidad base antes del ajuste ambiental.
  ambiente.prepararLuces();
  dinamico.actualizar(dt);
  ambiente.actualizar(dt);

  relojEntorno += dt;

  // Descarte por distancia del entorno.
  if (relojEntorno >= 0.12) {
    entorno.actualizar();
    relojEntorno = 0;
  }

  // Habitaciones interactivas.
  sala.actualizar(dt);
  comedor.actualizar(dt);
  boticario.actualizar(dt);
  estudio.actualizar(dt);
  salaDeseos.actualizar(dt);
  observatorio.actualizar(dt);
  galeriaMapas.actualizar(dt);
  consejoPoetico.actualizar(dt);

  // Evaluar después de las cámaras animadas: mostrar sin retardo al girar.
  oclusion.actualizar(dt);
  // Renderizado y métricas.
  rendimiento.antes(dt);

  renderizador.render(
    escena,
    camara
  );

  dinamico.registrarMetricas();

  rendimiento.despues(
    crudo,
    performance.now() - inicio
  );
});

},
"./quitarBarandasTercerPiso.js": function(module, exports, __require) {
const THREE = __THREE;


function quitarBarandasTercerPiso(castillo) {
  if(castillo.getObjectByName('Estructura agrupada por sectores'))throw new Error('Quita las barandas antes de agruparEstructura.');
  castillo.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),p=new THREE.Vector3();
  const eliminar=[];
  castillo.traverse(o=>{
    if(!o.isMesh||!/Baranda|Balaustre|Pasamanos/i.test(o.name))return;
    // Conserva las piezas de la espiral y las de la segunda planta.
    if(/caracol|escalera/i.test(o.name))return;
    o.getWorldPosition(p).applyMatrix4(inv);
    if(p.y>=17.45&&p.y<=19.2)eliminar.push(o);
  });
  const conjunto=new Set(eliminar),obstaculos=castillo.userData.colisiones;
  let colisiones=0;
  for(let i=obstaculos.length-1;i>=0;i--)if(conjunto.has(obstaculos[i].mesh)){obstaculos.splice(i,1);colisiones++;}
  for(const o of eliminar)o.removeFromParent();
  return {piezasRetiradas:eliminar.length,colisionesRetiradas:colisiones,
    nota:'Tercer piso sin barandas: es posible caer por bordes y huecos.'};
}

exports.quitarBarandasTercerPiso = quitarBarandasTercerPiso;
},
"./boticarioArmeria.js": function(module, exports, __require) {
const { decorarBoticario } = __require("./decoracionBoticario.js");
const THREE = __THREE;
const { crearApiPlantas } = __require("./apiPlantas.js");
// BOTICARIO_IMAGEN_DEFAULT_V3

// BOTICARIO_MEJORADO_V2



// Crear despues de construir habitaciones y ANTES de cachear/fusionar geometria.
function crearBoticarioArmeria(escena, camara, castillo, elemento, opciones = {}) {
  const limpio=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const puerta=castillo.userData.puertas.find(p=>limpio(p.nombre)==='armeria');
  if(!puerta)throw new Error('No se encontró la puerta Armeria.');
  const habitacion=puerta.nombre,api=crearApiPlantas(opciones);
  const recursos={g:new Set(),m:new Set(),t:new Set()};
  let controles=null,oclusion=null,abierto=false,destruido=false;
  let busqueda=opciones.busquedaInicial || '',pagina=1,total=0,resultados=[],actual=null,pestana='catalogo';
  let cargaBusqueda=null,cargaDetalle=null,versionBusqueda=0,versionDetalle=0,consultado=false;
  const inv=new THREE.Matrix4(),p=new THREE.Vector3();castillo.updateMatrixWorld(true);inv.copy(castillo.matrixWorld).invert();
  const dentro=v=>v.x>-19.95&&v.x<-7.05&&v.z>-17.95&&v.z<-2.05&&v.y>3&&v.y<9.95;
  const protegidos=new Set();puerta.marco.traverse(o=>protegidos.add(o));

  // 01. RETIRAR ARMARIOS, MESAS Y LUMINARIAS ANTERIORES DE LA ARMERIA.
  const quitar=new Set(),muebles=/^(Mesa|Armario|Estanteria|Libros|Cama|Cabecera|Cadena candelabro|Brazo candelabro|Vela|Soporte antorcha)/i;
  castillo.traverse(o=>{if(protegidos.has(o))return;o.getWorldPosition(p).applyMatrix4(inv);if(!dentro(p))return;
    if(o.isPointLight||(o.isMesh&&muebles.test(o.name))){quitar.add(o);return;}
    if(o.isMesh&&o.material){const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m?.emissive&&m.emissive.r>.2&&m.emissive.r>m.emissive.g))quitar.add(o);}
  });
  const todos=new Set();for(const o of quitar)o.traverse(c=>todos.add(c));const colisiones=castillo.userData.colisiones;let retiradas=0;
  for(let i=colisiones.length-1;i>=0;i--)if(todos.has(colisiones[i].mesh)){colisiones.splice(i,1);retiradas++;}
  for(const o of quitar)o.removeFromParent();

  // 02. DECORACION: MADERA, PAREDES VERDES Y MATERIALES SIN LUCES NUEVAS.
  function mat(color){const m=new THREE.MeshBasicMaterial({color,toneMapped:false});recursos.m.add(m);return m;}
  const madera=mat(0x594735),marco=mat(0x303d32),verde=mat(0x6f8170),crema=mat(0xc4bea3),oro=mat(0xb4a06c),tierra=mat(0x835c44),hojas=mat(0x477155);
  const grupo=new THREE.Group();grupo.name='Boticario Armeria';grupo.visible=false;castillo.add(grupo);
  const cube=new THREE.BoxGeometry(1,1,1);recursos.g.add(cube);
  function caja(nombre,x,y,z,w,h,d,material,solido=false){const o=new THREE.Mesh(cube,material);o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.userData.habitacion=habitacion;grupo.add(o);if(solido)colisiones.push({mesh:o,w,h,d,esCaja:true});return o;}
  caja('Suelo boticario',-13.45,3.025,-10,12.2,.02,15.2,madera);
  caja('Techo boticario',-13.45,9.675,-10,12.2,.02,15.2,marco);
  caja('Mural boticario fondo',-19.55,6.35,-10,.025,6.6,15.2,verde);
  caja('Mural boticario sur',-13.45,6.35,-17.6,12.2,6.6,.025,crema);
  caja('Mural boticario norte',-13.45,6.35,-2.4,12.2,6.6,.025,crema);
  caja('Entrada boticario sur',-7.35,6.35,-14.45,.025,6.6,6.3,verde);
  caja('Entrada boticario norte',-7.35,6.35,-5.55,.025,6.6,6.3,verde);
  caja('Dintel boticario',-7.35,8.15,-10,.025,3,2.6,verde);
  caja('Mueble herbario',-13.8,3.6,-10,4.4,1.2,2,madera,true);
  caja('Tablero mesa herbario',-13.8,4.25,-10,4.6,.1,2.15,marco);
  caja('Estante botanico',-19.0,4.75,-10,.8,3.1,10.5,madera,true);
  for(const y of [3.4,4.6,5.8,6.35])caja('Balda boticario',-18.86,y,-10,1.04,.12,10.7,marco);
  for(const z of [-15.2,-10,-4.8])caja('Separador boticario',-18.86,4.9,z,1.04,2.9,.08,marco);
  for(const z of [-17.5,-2.5])for(const y of [3.18,9.5])caja('Remate boticario',-13.45,y,z,12.1,.06,.04,oro);

  // Macetas genericas: decoracion, no modelos identificados como una especie real.
  const potGeo=new THREE.CylinderGeometry(.30,.22,.46,10),leafGeo=new THREE.SphereGeometry(1,6,4);recursos.g.add(potGeo);recursos.g.add(leafGeo);
  const posiciones=[[-18.6,6.65,-14],[-18.6,6.65,-10],[-18.6,6.65,-6],[-15.4,4.55,-10.5],[-12.3,4.55,-10.5]];
  const pots=new THREE.InstancedMesh(potGeo,tierra,posiciones.length),leaves=new THREE.InstancedMesh(leafGeo,hojas,posiciones.length*5),dummy=new THREE.Object3D();
  posiciones.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();pots.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;dummy.position.set(x+Math.cos(a)*.18,y+.5,z+Math.sin(a)*.18);dummy.rotation.set(Math.sin(a)*.5,a,Math.cos(a)*.5);dummy.scale.set(.14,.5,.2);dummy.updateMatrix();leaves.setMatrixAt(i*5+j,dummy.matrix);}
  });
  for(const o of [pots,leaves]){o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();o.userData.habitacion=habitacion;grupo.add(o);}

  // 03. HERBARIO INTERACTIVO Y CARTEL.
  caja('Soporte herbario',-11.65,4.38,-10,.16,.25,2.4,marco);
  const cartel=document.createElement('canvas');cartel.width=768;cartel.height=384;const cg=cartel.getContext('2d');cg.fillStyle='#d1c5a4';cg.fillRect(0,0,768,384);cg.strokeStyle='#596b4d';cg.lineWidth=8;cg.strokeRect(18,18,732,348);cg.textAlign='center';cg.fillStyle='#294638';cg.font='bold 66px Georgia';cg.fillText('HERBARIO',384,125);cg.font='31px Georgia';cg.fillText('El boticario del castillo',384,190);cg.font='26px Arial';cg.fillText('Haz clic para aprender sobre plantas',384,265);cg.font='22px Arial';cg.fillText('Observar también es una forma de cuidar',384,320);
  const tex=new THREE.CanvasTexture(cartel);tex.colorSpace=THREE.SRGBColorSpace;recursos.t.add(tex);const bookMat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});recursos.m.add(bookMat);
  const bookGeo=new THREE.PlaneGeometry(2.8,1.4);recursos.g.add(bookGeo);const libro=new THREE.Mesh(bookGeo,bookMat);libro.name='Abrir boticario';libro.position.set(-11.5,5.05,-10);libro.rotation.y=Math.PI/2;libro.userData.habitacion=habitacion;libro.userData.interactivo=true;grupo.add(libro);
  decorarBoticario(castillo,grupo,recursos);

  // 04. HERBARIO PERSONAL LOCAL. NO ESCRIBE DATOS EN LAS APIS.
  const imagenDefaultSVG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%20role%3D%22img%22%20aria-labelledby%3D%22title%20desc%22%3E%3Ctitle%20id%3D%22title%22%3EIlustraci%C3%B3n%20bot%C3%A1nica%20de%20respaldo%3C%2Ftitle%3E%3Cdesc%20id%3D%22desc%22%3EPlanta%20ornamental%20estilizada%20en%20maceta%2C%20con%20fondo%20marfil%20y%20verdes%20suaves.%20No%20representa%20una%20especie%20identificada.%3C%2Fdesc%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23f2edda%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23cbd9c6%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22pot%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23b39a6d%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23786b4d%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23bg)%22%2F%3E%3Ccircle%20cx%3D%22402%22%20cy%3D%22284%22%20r%3D%22193%22%20fill%3D%22%23ffffff%22%20opacity%3D%22.34%22%2F%3E%3Cpath%20d%3D%22M184%20438V238a216%20216%200%200%201%20432%200v200%22%20fill%3D%22none%22%20stroke%3D%22%239aa987%22%20stroke-width%3D%222%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%237c9976%22%20opacity%3D%22.24%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M102%20504C120%20379%2097%20281%2064%20214M692%20509c-9-124%2021-224%2053-281%22%2F%3E%3Cellipse%20cx%3D%2285%22%20cy%3D%22286%22%20rx%3D%2215%22%20ry%3D%2240%22%20transform%3D%22rotate(-35%2085%20286)%22%2F%3E%3Cellipse%20cx%3D%22113%22%20cy%3D%22359%22%20rx%3D%2215%22%20ry%3D%2240%22%20transform%3D%22rotate(30%20113%20359)%22%2F%3E%3Cellipse%20cx%3D%22723%22%20cy%3D%22312%22%20rx%3D%2215%22%20ry%3D%2240%22%20transform%3D%22rotate(35%20723%20312)%22%2F%3E%3Cellipse%20cx%3D%22696%22%20cy%3D%22387%22%20rx%3D%2215%22%20ry%3D%2240%22%20transform%3D%22rotate(-30%20696%20387)%22%2F%3E%3C%2Fg%3E%3Cellipse%20cx%3D%22400%22%20cy%3D%22514%22%20rx%3D%22133%22%20ry%3D%2219%22%20fill%3D%22%2351644e%22%20opacity%3D%22.16%22%2F%3E%3Cg%20stroke%3D%22%23466e52%22%20stroke-width%3D%2210%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M400%20422c-1-91-4-198%2018-281M400%20360l-85-91M406%20306l85-91M403%20395l84-62%22%2F%3E%3C%2Fg%3E%3Cg%3E%3Cpath%20d%3D%22M413%20202c-55-40-58-84-28-117%2048%2020%2070%2069%2028%20117%22%20fill%3D%22%235c875c%22%2F%3E%3Cpath%20d%3D%22M403%20263c-85%209-138-19-140-78%2066-15%20130%2013%20140%2078%22%20fill%3D%22%237f9b67%22%2F%3E%3Cpath%20d%3D%22M410%20306c8-75%2053-123%20117-109%203%2065-48%20105-117%20109%22%20fill%3D%22%23446f54%22%2F%3E%3Cpath%20d%3D%22M393%20355c-75%2022-138-4-151-59%2064-28%20128-8%20151%2059%22%20fill%3D%22%236a8f62%22%2F%3E%3Cpath%20d%3D%22M405%20393c25-67%2083-95%20133-63-14%2060-73%2083-133%2063%22%20fill%3D%22%2382a075%22%2F%3E%3Cpath%20d%3D%22M399%20420c-62%2010-103-9-115-51%2052-16%2098%206%20115%2051%22%20fill%3D%22%233f6d52%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M317%20426h166l-21%2091H339z%22%20fill%3D%22url(%23pot)%22%2F%3E%3Crect%20x%3D%22309%22%20y%3D%22414%22%20width%3D%22182%22%20height%3D%2225%22%20rx%3D%228%22%20fill%3D%22%23a58d65%22%2F%3E%3Cpath%20d%3D%22M354%20448l10%2052M400%20448v52M446%20448l-10%2052%22%20stroke%3D%22%23d9c79b%22%20stroke-width%3D%223%22%20opacity%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M65%20555h670%22%20stroke%3D%22%2398a285%22%20stroke-width%3D%221%22%2F%3E%3Cg%20fill%3D%22%2363745a%22%20opacity%3D%22.65%22%3E%3Ccircle%20cx%3D%22379%22%20cy%3D%22554%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22554%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%22421%22%20cy%3D%22554%22%20r%3D%223%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
  const imagenPorDefecto = opciones.imagenPorDefecto || imagenDefaultSVG;
  const fotosFallidas=new Set();
  let paginaFavoritos=1;
  const clave='castillo.boticario.v1';let guardado={favoritos:{},estudiadas:[],notas:{}};
  try{const data=JSON.parse(localStorage.getItem(clave)||'null');if(data&&typeof data==='object')guardado={favoritos:data.favoritos||{},estudiadas:Array.isArray(data.estudiadas)?data.estudiadas:[],notas:data.notas||{}};}catch{}
  function guardar(){try{localStorage.setItem(clave,JSON.stringify(guardado));}catch{estado('Tu navegador no permitió guardar el herbario local.');}}

  // 05. INTERFAZ EN ESPAÑOL, TACTIL Y SIN HTML PROCEDENTE DE LA API.
  const estilo=document.createElement('style');estilo.textContent=`
    #bt-abrir[hidden],#bt-modal[hidden]{display:none!important}
    #bt-abrir{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:9;padding:12px 18px;background:#294e3d;color:#fff5d9;border:1px solid #b2aa77;border-radius:22px;min-height:44px;font:600 13px system-ui;touch-action:manipulation}
    #bt-modal{position:fixed;inset:0;z-index:78;display:flex;align-items:center;justify-content:center;padding:14px;background:#0c191af2;color:#f1ecd9;font:14px system-ui;overflow:auto}
    #bt-panel{width:min(1180px,100%);max-height:96dvh;overflow:auto;background:#18342e;border:1px solid #b3aa7b;border-radius:14px;padding:18px;box-sizing:border-box}
    #bt-panel *{box-sizing:border-box}#bt-panel h2{font:400 28px Georgia;margin:0}#bt-panel h3{margin:0 0 6px;font-size:19px}#bt-panel p{line-height:1.6}.bt-fila{display:flex;gap:9px;flex-wrap:wrap;align-items:center;justify-content:space-between}.bt-herramientas{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
    #bt-panel input,#bt-panel button,#bt-panel textarea{font:inherit;border:1px solid #8f9d76;border-radius:8px;padding:10px;background:#284b40;color:#fff8e5;min-height:44px}#bt-panel input[type=search]{flex:1;min-width:160px}#bt-panel button{cursor:pointer;touch-action:manipulation}#bt-panel button:disabled{opacity:.45;cursor:default}#bt-panel button[aria-pressed=true]{background:#86774e}#bt-panel a{color:#edda9c}#bt-panel textarea{width:100%;min-height:85px;resize:vertical}
    #bt-estado{min-height:1.4em;color:#e4d092}#bt-cuerpo{display:grid;grid-template-columns:minmax(250px,1fr) minmax(280px,1fr);gap:16px;align-items:start}#bt-lista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .bt-planta{display:flex;flex-direction:column;gap:6px;text-align:left;min-width:0}.bt-planta strong{font-size:14px}.bt-planta em{font-size:12px;font-weight:400}.bt-planta img{width:100%;height:125px;object-fit:cover;border-radius:5px}.bt-sin-foto{display:grid;place-items:center;min-height:90px;border:1px dashed #829275;color:#c8d0b4;font:12px system-ui;text-align:center;padding:10px}
    #bt-detalle{padding:16px;background:#102922;border:1px solid #81916a;border-radius:10px;min-height:220px}#bt-detalle>img{display:block;max-height:300px;width:100%;object-fit:contain;background:#0c201b;border-radius:7px}#bt-detalle small{display:block;line-height:1.5;color:#c5cdb7;margin:7px 0}.bt-datos{display:grid;grid-template-columns:minmax(90px,.8fr) 1.2fr;gap:7px 12px;margin:14px 0}.bt-datos dt{color:#bec9a9}.bt-datos dd{margin:0;overflow-wrap:anywhere}#bt-descripcion{white-space:pre-line}#bt-panel .bt-aviso{font-size:12px;color:#c9ceb6;border-top:1px solid #718367;padding-top:10px;margin-top:14px}
    #bt-panel :focus-visible{outline:2px solid #f2d58c;outline-offset:3px}
    @media(max-width:700px){#bt-modal{padding:8px}#bt-panel{padding:12px}#bt-cuerpo{grid-template-columns:1fr}#bt-lista{grid-template-columns:repeat(2,minmax(0,1fr))}.bt-planta img{height:105px}#bt-panel h2{font-size:24px}}
  `;document.head.appendChild(estilo);
  const activar=document.createElement('button');activar.type='button';activar.id='bt-abrir';activar.textContent='Explorar plantas · B';activar.hidden=true;document.body.appendChild(activar);
  const modal=document.createElement('div');modal.id='bt-modal';modal.hidden=true;modal.innerHTML=`<section id="bt-panel" role="dialog" aria-modal="true" aria-labelledby="bt-titulo"><div class="bt-fila"><h2 id="bt-titulo">El boticario · Herbario vivo</h2><button type="button" id="bt-volver">Volver al castillo</button></div><p>Explora especies y crea tu colección de aprendizaje. Datos de iNaturalist; descripciones de Wikipedia en español cuando están disponibles.</p><form id="bt-form" class="bt-herramientas"><input id="bt-busqueda" type="search" maxlength="80" placeholder="Nombre común o científico" aria-label="Buscar plantas"><button type="submit" id="bt-buscar">Buscar</button></form><div class="bt-herramientas"><button type="button" id="bt-catalogo" aria-pressed="true">Catálogo</button><button type="button" id="bt-favoritos" aria-pressed="false">Mi herbario</button><button type="button" data-bt-q="Rosa">Rosa</button><button type="button" data-bt-q="Lavandula">Lavandula</button><button type="button" data-bt-q="Salvia">Salvia</button><button type="button" data-bt-q="Origanum">Origanum</button></div><p id="bt-estado" role="status" aria-live="polite"></p><div id="bt-cuerpo"><div><div id="bt-lista"></div><div class="bt-herramientas"><button type="button" id="bt-anterior">Anterior</button><span id="bt-pagina"></span><button type="button" id="bt-siguiente">Siguiente</button></div></div><article id="bt-detalle"><p>Selecciona una planta para abrir su ficha.</p></article></div><p class="bt-aviso">Herbario educativo: no determina si una planta puede consumirse o usarse como tratamiento. Los registros son observaciones de una plataforma, no un censo de la población. No se ofrecen dosis, recetas ni guías de cultivo inventadas.</p></section>`;document.body.appendChild(modal);
  const $=id=>modal.querySelector('#'+id);$('bt-busqueda').value=busqueda;
  estilo.textContent += "\n    /* BOTICARIO V2: FOTOGRAFIAS Y DISEÑO DE HERBARIO */\n    #bt-modal{background:linear-gradient(140deg,#061411f5,#13291df5);padding:18px}\n    #bt-panel{width:min(1280px,100%);padding:24px;background:linear-gradient(145deg,#223c30,#102b25);border-color:#ad9d73;border-radius:18px;box-shadow:0 24px 80px #0008}\n    #bt-panel h2{font-family:Georgia,serif;font-size:32px;font-weight:400;color:#f3e4bd}\n    #bt-panel h3{font-family:Georgia,serif;color:#f1dfb1;font-size:23px;font-weight:400}\n    #bt-panel .bt-herramientas{gap:9px}#bt-form{padding:12px;background:#0c221b88;border:1px solid #a79d6e55;border-radius:12px}\n    #bt-panel input[type=search]{background:#f2eddb;color:#243d2d;border:0}#bt-panel input[type=search]::placeholder{color:#667460}\n    #bt-panel button{transition:background .18s ease,transform .18s ease}#bt-panel button:hover:not(:disabled){background:#3d6551}\n    #bt-cuerpo{grid-template-columns:minmax(340px,1.13fr) minmax(320px,1fr);gap:20px}\n    #bt-lista{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}\n    #bt-panel .bt-planta{padding:0 0 12px;overflow:hidden;background:#eff0de;color:#213b2d;border:1px solid #a4b298;border-radius:13px;box-shadow:0 5px 15px #0002}\n    #bt-panel .bt-planta:hover{background:#fff9e5;transform:translateY(-3px)}#bt-panel .bt-planta img{height:auto;aspect-ratio:4/3;border-radius:0;object-fit:cover}\n    #bt-panel .bt-planta strong,#bt-panel .bt-planta em,#bt-panel .bt-planta small{padding:0 11px}#bt-panel .bt-planta strong{font-size:14px;line-height:1.35}#bt-panel .bt-planta em{font-size:12px;color:#4e6854}\n    #bt-panel .bt-planta small{color:#315e45;font-size:11px}\n    #bt-contador{font-size:12px;color:#c6d3b4;margin:0 0 10px}#bt-solo-fotos{display:inline-block;border:1px solid #9eaa7555;padding:6px 10px;border-radius:18px;color:#dcdfbb;font-size:11px;margin-bottom:9px}\n    #bt-detalle{background:#0e251c;border-color:#83936b;border-radius:14px;padding:20px;position:sticky;top:0;max-height:77dvh;overflow:auto}\n    #bt-detalle>img{max-height:320px;border-radius:10px;background:#071810}#bt-detalle .bt-herramientas button{flex:1}\n    #bt-panel .bt-datos{padding:12px;border-radius:9px;background:#ffffff07;border:1px solid #81916a33}#bt-panel .bt-datos dd{color:#e7e8cf}\n    #bt-estado{padding:9px 12px;border-radius:8px;background:#c9b56d13;line-height:1.5}\n    @media(max-width:1000px){#bt-lista{grid-template-columns:repeat(2,minmax(0,1fr))}}\n    @media(max-width:700px){#bt-modal{padding:8px}#bt-panel{padding:14px}#bt-panel h2{font-size:26px}#bt-cuerpo{grid-template-columns:1fr}#bt-detalle{position:static;max-height:none}#bt-panel .bt-planta img{height:auto;aspect-ratio:4/3}}\n    @media(prefers-reduced-motion:reduce){#bt-panel button{transition:none!important}}\n";
  estilo.textContent += "\n    /* IMAGEN DEFAULT V3: las ilustraciones no ocultan ninguna especie. */\n    #bt-panel .bt-planta .bt-media{width:100%;margin:0;display:block;position:relative}\n    #bt-panel .bt-planta .bt-media img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:0}\n    #bt-panel .bt-media-default{background:#dbe3cf}\n    #bt-panel .bt-planta .bt-media-default img{object-fit:cover}\n    #bt-panel .bt-imagen-nota{padding:7px 9px;font:10px/1.4 system-ui;color:#455c46;background:#e3e8d6}\n    #bt-panel .bt-imagen-nota[hidden]{display:none!important}\n    #bt-detalle .bt-media{margin:10px 0 14px;border-radius:10px;overflow:hidden;background:#0c201b}\n    #bt-detalle .bt-media img{display:block;width:100%;height:300px;object-fit:contain}\n    #bt-detalle .bt-media-default img{object-fit:contain;background:#dbe3cf}\n    #bt-panel .bt-media-sin-img{min-height:140px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#e5ead7,#c0d1ba)}\n    #bt-detalle .bt-credito-foto{font-size:12px;line-height:1.5;margin-bottom:12px}\n";
  const contador=document.createElement('p');contador.id='bt-contador';$('bt-lista').insertAdjacentElement('beforebegin',contador);
  const etiquetaFotos=document.createElement('span');etiquetaFotos.id='bt-solo-fotos';etiquetaFotos.textContent='Todas las plantas · fotos o ilustraciones';contador.insertAdjacentElement('beforebegin',etiquetaFotos);
  const estado=t=>{$('bt-estado').textContent=t;};
  function texto(tag,t){const o=document.createElement(tag);o.textContent=t;return o;}
  function enlace(label,url){const seguro=api.urlSegura(url);if(!seguro)return texto('span','Fuente no disponible');const a=texto('a',label);a.href=seguro;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function fotoValida(foto){
    const licencias=opciones.licenciasFotos||['cc0','cc-by','cc-by-sa'];
    return Boolean(foto&&api.urlSegura(foto.src)&&licencias.includes(String(foto.licencia||'').toLowerCase()));
  }
  function actualizarContadorFotos(){
    const lista=$('bt-lista'),tarjetas=[...lista.querySelectorAll('.bt-planta')];
    const genericas=tarjetas.filter(b=>b.querySelector('img[data-ilustracion="true"]')).length;
    $('bt-contador').textContent=tarjetas.length+' plantas · '+(tarjetas.length-genericas)+' fotografías · '+genericas+' ilustraciones de respaldo';
    if(tarjetas.length){lista.querySelector('.bt-vacio')?.remove();}
    else if(!lista.querySelector('.bt-vacio')){const p=texto('p',pestana==='favoritos'?'Tu herbario está vacío. Guarda plantas desde sus fichas.':'No se encontraron plantas en esta página. Prueba otra búsqueda.');p.className='bt-vacio';lista.appendChild(p);}
  }
  function imagen(foto,alt){
    const figura=document.createElement('figure');figura.className='bt-media';
    const img=document.createElement('img');img.className='bt-foto';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    const nota=texto('figcaption','');nota.className='bt-imagen-nota';nota.hidden=true;figura.append(img,nota);
    let generica=!fotoValida(foto)||fotosFallidas.has(foto.src),intentoSVG=false;
    function marcarDefault(){
      generica=true;img.dataset.ilustracion='true';figura.classList.add('bt-media-default');
      img.alt='Ilustración botánica genérica. No es una fotografía de '+alt+'.';
      nota.hidden=false;nota.textContent='Imagen ilustrativa · no representa necesariamente esta especie';
      img.closest('#bt-detalle')?.querySelector('.bt-credito-foto')?.remove();
    }
    function usarSVG(){marcarDefault();intentoSVG=true;img.src=imagenDefaultSVG;}
    img.addEventListener('error',()=>{
      if(!generica){if(foto?.src)fotosFallidas.add(foto.src);marcarDefault();img.src=imagenPorDefecto;intentoSVG=imagenPorDefecto===imagenDefaultSVG;}
      else if(!intentoSVG)usarSVG();
      else{img.hidden=true;figura.classList.add('bt-media-sin-img');nota.hidden=false;nota.textContent='Imagen ilustrativa no disponible. La información de la planta sigue disponible.';}
      actualizarContadorFotos();
    });
    if(generica){marcarDefault();img.src=imagenPorDefecto;intentoSVG=imagenPorDefecto===imagenDefaultSVG;}
    else{img.dataset.ilustracion='false';img.alt=alt;img.src=foto.src;}
    queueMicrotask(()=>{if(!destruido)actualizarContadorFotos();});
    return figura;
  }
  function paginaUI(){
    if(pestana==='favoritos'){
      const n=Object.keys(guardado.favoritos).length;
      $('bt-anterior').disabled=paginaFavoritos<=1;$('bt-siguiente').disabled=paginaFavoritos*12>=n;
      $('bt-pagina').textContent='Mi herbario · página '+paginaFavoritos;
    }else{
      $('bt-anterior').disabled=pagina<=1;$('bt-siguiente').disabled=pagina*12>=total;
      $('bt-pagina').textContent='Página '+pagina+' de la fuente';
    }
  }
  function mostrarLista(items){
    $('bt-lista').replaceChildren();
    for(const item of items){
      const b=document.createElement('button');b.type='button';b.className='bt-planta';b.dataset.foto=item.foto?.src||'';
      b.appendChild(imagen(item.foto,item.nombre));b.append(texto('strong',item.nombre),texto('em',item.cientifico));
      if(guardado.estudiadas.includes(item.id))b.appendChild(texto('small','Estudiada'));
      b.addEventListener('click',()=>verPlanta(item.id));$('bt-lista').appendChild(b);
    }
    actualizarContadorFotos();
  }
  function tab(nombre){pestana=nombre;$('bt-catalogo').setAttribute('aria-pressed',String(nombre==='catalogo'));$('bt-favoritos').setAttribute('aria-pressed',String(nombre==='favoritos'));}
  function verFavoritos(p=1){
    if(!abierto||destruido)return;
    cargaBusqueda?.abort();versionBusqueda++;
    tab('favoritos');paginaFavoritos=Math.max(1,Number.isFinite(p)?Math.floor(p):1);
    const todos=Object.values(guardado.favoritos);
    paginaFavoritos=Math.min(paginaFavoritos,Math.max(1,Math.ceil(todos.length/12)));
    const bloque=todos.slice((paginaFavoritos-1)*12,paginaFavoritos*12);
    mostrarLista(bloque);paginaUI();
    estado(todos.length?'Tu herbario completo: las plantas sin fotografía usan una ilustración. Abre una ficha para consultar sus datos actualizados.':'Tu herbario está vacío. Guarda plantas desde sus fichas.');
  }
  async function buscar(p=1){
    if(!abierto||destruido)return;tab('catalogo');pagina=Math.max(1,p);busqueda=$('bt-busqueda').value.trim();
    const v=++versionBusqueda;cargaBusqueda?.abort();cargaBusqueda=new AbortController();
    estado('Consultando plantas…');$('bt-buscar').disabled=true;$('bt-anterior').disabled=$('bt-siguiente').disabled=true;
    try{
      const data=await api.buscar(busqueda,pagina,cargaBusqueda.signal);if(destruido||!abierto||v!==versionBusqueda)return;
      resultados=data.plantas;total=data.total;consultado=true;mostrarLista(resultados);paginaUI();estado(resultados.length+' plantas en esta página. Las que no tienen fotografía disponible usan una ilustración botánica.');
    }catch(error){if(error.name!=='AbortError'&&v===versionBusqueda&&!destruido)estado('No se pudo consultar: '+error.message+' Comprueba tu conexión o reintenta.');}
    finally{if(!destruido&&v===versionBusqueda){$('bt-buscar').disabled=false;paginaUI();}}
  }
  const rangos={kingdom:'Reino',phylum:'Filo',subphylum:'Subfilo',class:'Clase',order:'Orden',family:'Familia',genus:'Género',species:'Especie'};
  function renderDetalle(planta){
    actual=planta;const cont=$('bt-detalle');cont.replaceChildren();
    cont.append(texto('h3',planta.nombre),texto('p',planta.cientifico),imagen(planta.foto,planta.nombre));
    if(fotoValida(planta.foto)&&!fotosFallidas.has(planta.foto.src)){const creditos=document.createElement('div');creditos.className='bt-credito-foto';creditos.appendChild(texto('small',planta.foto.atribucion+' · Licencia: '+planta.foto.licencia));if(planta.foto.id)creditos.appendChild(enlace('Fuente de la fotografía','https://www.inaturalist.org/photos/'+planta.foto.id));cont.appendChild(creditos);}
    const datos=document.createElement('dl');datos.className='bt-datos';
    function dato(k,v){datos.append(texto('dt',k),texto('dd',v));}
    dato('Nombre científico',planta.cientifico);dato('Nombre común',planta.nombre===planta.cientifico?'No disponible en la fuente':planta.nombre);
    dato('Rango',rangos[planta.rango]||planta.rango);dato('Registros',planta.registros===null?'No disponibles':new Intl.NumberFormat('es').format(planta.registros));
    for(const a of planta.ancestros)if(rangos[a.rank]&&['kingdom','phylum','class','order','family','genus'].includes(a.rank))dato(rangos[a.rank],a.name||'No disponible');
    cont.appendChild(datos);
    const acciones=document.createElement('div');acciones.className='bt-herramientas';const favorito=document.createElement('button'),estudiada=document.createElement('button');favorito.type=estudiada.type='button';
    function etiquetas(){favorito.textContent=guardado.favoritos[planta.id]?'Quitar de mi herbario':'Guardar en mi herbario';estudiada.textContent=guardado.estudiadas.includes(planta.id)?'Estudiada: sí':'Marcar como estudiada';}
    favorito.addEventListener('click',()=>{if(guardado.favoritos[planta.id])delete guardado.favoritos[planta.id];else guardado.favoritos[planta.id]={id:planta.id,nombre:planta.nombre,cientifico:planta.cientifico,foto:planta.foto};guardar();etiquetas();if(pestana==='favoritos')verFavoritos(paginaFavoritos);});
    estudiada.addEventListener('click',()=>{const i=guardado.estudiadas.indexOf(planta.id);if(i>=0)guardado.estudiadas.splice(i,1);else guardado.estudiadas.push(planta.id);guardar();etiquetas();});etiquetas();acciones.append(favorito,estudiada);cont.appendChild(acciones);
    cont.appendChild(texto('h3','Sobre esta planta'));const desc=texto('p','Buscando una descripción en español…');desc.id='bt-descripcion';cont.appendChild(desc);const fuenteDesc=document.createElement('div');fuenteDesc.id='bt-fuente-descripcion';cont.appendChild(fuenteDesc);
    cont.appendChild(texto('h3','Conservación según la fuente'));
    if(!planta.estados.length)cont.appendChild(texto('p','No se recibió un estado de conservación. Esto no equivale a una clasificación de seguridad o abundancia.'));
    for(const e of planta.estados.slice(0,5)){const lugar=e.place?.display_name||e.place?.name||'Ámbito no indicado';cont.appendChild(texto('p',[e.authority||'Autoridad no indicada',e.status_name||e.status||'Estado no indicado',lugar].join(' · ')));}
    cont.appendChild(enlace('Ver ficha en iNaturalist',planta.fuente));
    if(planta.wikipedia){cont.appendChild(texto('span',' · '));cont.appendChild(enlace('Artículo indicado por la fuente',planta.wikipedia));}
    cont.appendChild(texto('h3','Mis notas'));const notas=document.createElement('textarea');notas.maxLength=2000;notas.setAttribute('aria-label','Notas sobre esta planta');notas.value=guardado.notas[planta.id]||'';notas.placeholder='Qué aprendiste, qué quieres observar…';notas.addEventListener('change',()=>{guardado.notas[planta.id]=notas.value;guardar();});cont.appendChild(notas);
  }
  async function verPlanta(id){
    if(!abierto||destruido)return;const v=++versionDetalle;cargaDetalle?.abort();cargaDetalle=new AbortController();const signal=cargaDetalle.signal;
    $('bt-detalle').replaceChildren(texto('p','Cargando ficha…'));
    try{
      const planta=await api.detalle(id,signal);if(destruido||!abierto||v!==versionDetalle)return;renderDetalle(planta);
      if(window.innerWidth<700)$('bt-detalle').scrollIntoView({behavior:'smooth',block:'start'});
      try{
        const descripcion=await api.descripcion(planta.cientifico,signal);if(destruido||!abierto||v!==versionDetalle)return;
        $('bt-descripcion').textContent=descripcion?.texto||'No se encontró una descripción en español para este nombre científico. Puedes consultar la ficha original.';
        if(descripcion)$('bt-fuente-descripcion').append(enlace('Fuente y licencia del extracto: Wikipedia',descripcion.fuente));
      }catch(error){if(error.name!=='AbortError'&&v===versionDetalle&&!destruido&&$('bt-descripcion'))$('bt-descripcion').textContent='No se pudo consultar la descripción. Los datos taxonómicos de iNaturalist siguen disponibles.';}
    }catch(error){if(error.name!=='AbortError'&&v===versionDetalle&&!destruido)$('bt-detalle').replaceChildren(texto('p','No se pudo cargar la ficha: '+error.message));}
  }

  // 06. INTERACCION CON EL HERBARIO, PC/MOVIL Y VISIBILIDAD.
  const ray=new THREE.Raycaster(),centro=new THREE.Vector2(0,0),cursor=new THREE.Vector2(),mundo=new THREE.Vector3();
  function jugadorLocal(){castillo.updateWorldMatrix(true,false);inv.copy(castillo.matrixWorld).invert();return camara.getWorldPosition(p).applyMatrix4(inv);}
  function disponible(){if(destruido||abierto||!dentro(jugadorLocal()))return false;libro.getWorldPosition(mundo);return camara.position.distanceTo(mundo)<5;}
  function ocultarMenu(){if(abierto){const m=document.getElementById('menu');if(m)m.hidden=true;}}
  function abrir(){if(!disponible())return;abierto=true;modal.hidden=false;activar.hidden=true;controles?.pausar?.();if(document.pointerLockElement)document.exitPointerLock();ocultarMenu();$('bt-busqueda').focus();if(pestana==='favoritos')verFavoritos();else if(!consultado)buscar(1);}
  function cerrar(reanudar=true){if(!abierto)return;abierto=false;modal.hidden=true;cargaBusqueda?.abort();cargaDetalle?.abort();versionBusqueda++;versionDetalle++;$('bt-buscar').disabled=false;if(reanudar)document.getElementById('boton-iniciar')?.click();}
  function click(e){if(e.target!==elemento||!document.getElementById('menu')?.hidden||!disponible())return;if(document.pointerLockElement===elemento)ray.setFromCamera(centro,camara);else{const r=elemento.getBoundingClientRect();cursor.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(cursor,camara);}libro.updateWorldMatrix(true,false);if(ray.intersectObject(libro,false).length)abrir();}
  function tecla(e){if(e.repeat)return;if(abierto&&e.code==='Escape'){e.preventDefault();cerrar(true);return;}if(e.code==='KeyB'&&document.getElementById('menu')?.hidden&&disponible()){e.preventDefault();abrir();}}
  function pointerLock(){if(abierto)queueMicrotask(ocultarMenu);}
  activar.addEventListener('click',abrir);$('bt-volver').addEventListener('click',()=>cerrar(true));$('bt-form').addEventListener('submit',e=>{e.preventDefault();buscar(1);});
  $('bt-catalogo').addEventListener('click',()=>buscar(pagina));$('bt-favoritos').addEventListener('click',()=>verFavoritos(1));
  $('bt-anterior').addEventListener('click',()=>{if(pestana==='favoritos'){if(paginaFavoritos>1)verFavoritos(paginaFavoritos-1);}else if(pagina>1)buscar(pagina-1);});$('bt-siguiente').addEventListener('click',()=>{if(pestana==='favoritos'){if(paginaFavoritos*12<Object.keys(guardado.favoritos).length)verFavoritos(paginaFavoritos+1);}else if(pagina*12<total)buscar(pagina+1);});
  for(const b of modal.querySelectorAll('[data-bt-q]'))b.addEventListener('click',()=>{$('bt-busqueda').value=b.dataset.btQ;buscar(1);});
  elemento.addEventListener('click',click);document.addEventListener('keydown',tecla);document.addEventListener('pointerlockchange',pointerLock);
  function actualizar(){if(destruido)return;const estaDentro=dentro(jugadorLocal()),abierta=Boolean(puerta.abierta&&Math.abs(puerta.angulo??puerta.pivote.rotation.y)>.015),visible=oclusion?.estadisticas?.habitacionesVisibles?.includes(habitacion)??true;grupo.visible=(estaDentro||abierta)&&(estaDentro||visible);if(estaDentro)for(const o of grupo.children)o.visible=true;activar.hidden=abierto||!disponible()||!document.getElementById('menu')?.hidden;if(abierto)ocultarMenu();}
  return {actualizar,vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},abrir,cerrar,
    informe:{habitacion,objetosRetirados:quitar.size,colisionesRetiradas:retiradas,fuente:'iNaturalist + Wikipedia en español',requiereClave:false,lucesNuevas:0},
    liberar(){if(destruido)return;if(abierto)cerrar(false);destruido=true;cargaBusqueda?.abort();cargaDetalle?.abort();api.liberar();elemento.removeEventListener('click',click);document.removeEventListener('keydown',tecla);document.removeEventListener('pointerlockchange',pointerLock);activar.remove();modal.remove();estilo.remove();grupo.removeFromParent();grupo.userData.liberarDecoracion?.();pots.dispose();leaves.dispose();for(const g of recursos.g)g.dispose();for(const m of recursos.m)m.dispose();for(const t of recursos.t)t.dispose();}
  };
}

exports.crearBoticarioArmeria = crearBoticarioArmeria;
},
"./ampliacionSuperior.js": function(module, exports, __require) {
const THREE = __THREE;


// Ampliacion visual para el castillo con texturas, antes de crear los gestores.
function ampliarParteSuperior(castillo) {
  if(castillo.userData.ampliacionSuperior)return;
  const torre=castillo.getObjectByName('Torre central superior');
  if(!torre)throw new Error('La ampliacion requiere el castillo.js con texturas de esta conversacion.');
  const recursos={geometrias:[],materiales:[],texturas:[]};
  const geo=new THREE.BoxGeometry(1,1,1);recursos.geometrias.push(geo);
  const basePiedra=Array.isArray(torre.material)?torre.material:[torre.material];
  const cornisaOriginal=castillo.getObjectByName('Cornisa torre');
  const tejadoOriginal=castillo.getObjectByName('Tejado central');
  const baseMoldura=cornisaOriginal?(Array.isArray(cornisaOriginal.material)?cornisaOriginal.material:[cornisaOriginal.material]):basePiedra;
  const baseTecho=tejadoOriginal?.material??basePiedra[0];
  function materialConRepeticion(original,u,v) {
    const m=original.clone();recursos.materiales.push(m);
    for(const propiedad of ['map','bumpMap'])if(m[propiedad]) {
      m[propiedad]=m[propiedad].clone();m[propiedad].repeat.set(Math.max(0.15,u),Math.max(0.15,v));
      m[propiedad].needsUpdate=true;recursos.texturas.push(m[propiedad]);
    }
    return m;
  }
  function materialesCaja(base,w,h,d) {
    return [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]].map(([u,v],i)=>materialConRepeticion(base[i%base.length],u/4,v/4));
  }
  const raiz=new THREE.Group();raiz.name='Ampliacion superior';castillo.add(raiz);
  function caja(nombre,x,y,z,w,h,d,base=basePiedra) {
    const o=new THREE.Mesh(geo,materialesCaja(base,w,h,d));o.name=nombre;
    o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;raiz.add(o);return o;
  }
  function techoDosAguas(x,z,y,w,d,alto) {
    // Cumbrera longitudinal en Z; triangulos con orientacion exterior explicita.
    const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
    const p=[x,y+alto,z-d/2],q=[x,y+alto,z+d/2],vertices=[];
    const tri=(a,b,c)=>vertices.push(...a,...b,...c);
    tri(a,e,q);tri(a,q,p);tri(b,p,q);tri(b,q,c);tri(a,p,b);tri(e,c,q);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/4,vertices[i+2]/4+vertices[i+1]/4);
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();recursos.geometrias.push(g);
    const m=materialConRepeticion(baseTecho,1,1);m.side=THREE.DoubleSide;
    const o=new THREE.Mesh(g,m);o.name='Tejado de ala superior';o.castShadow=o.receiveShadow=true;raiz.add(o);
  }
  const ventanasMat=new THREE.MeshStandardMaterial({color:0x8adccc,emissive:0x16cdb6,emissiveIntensity:0.7,roughness:0.4});
  recursos.materiales.push(ventanasMat);
  function ventana(x,y,z,rot=0) {
    const grupo=new THREE.Group();grupo.position.set(x,y,z);grupo.rotation.y=rot;raiz.add(grupo);
    const marco=new THREE.Mesh(geo,materialesCaja(baseMoldura,0.9,1.9,0.16));marco.scale.set(0.9,1.9,0.16);grupo.add(marco);
    const cristal=new THREE.Mesh(geo,ventanasMat);cristal.scale.set(0.61,1.57,0.2);grupo.add(cristal);
    // Se modelan en el plano frontal; la barra no coincide en profundidad con el cristal.
    const barra=new THREE.Mesh(geo,materialesCaja(baseMoldura,0.07,1.6,0.23));barra.scale.set(0.07,1.6,0.23);grupo.add(barra);
  }
  function ala(nombre,x,z,w,d,h) {
    const base=17.5,cima=base+h;
    caja(nombre,x,base+h/2,z,w,h,d);
    caja('Cornisa '+nombre,x,cima+0.05,z,w+0.35,0.3,d+0.35,baseMoldura);
    techoDosAguas(x,z,cima+0.23,w+0.7,d+0.7,Math.min(4.5,w*0.5));
    for(const y of [base+2.3,base+5.7]) {
      if(y>cima-1)continue;
      for(let dx=-w/2+1.4;dx<w/2-0.7;dx+=2.3)ventana(x+dx,y,z+d/2+0.1);
    }
    for(const lado of [-1,1])for(let dz=-d/2+2;dz<d/2-1;dz+=3)
      ventana(x+lado*(w/2+0.1),base+3.5,z+dz,Math.PI/2);
  }
  // Torre principal mas ancha y alta, conservando su base sobre la cubierta.
  torre.scale.set(14,16,12);torre.position.set(0,25.5,-7);
  if(Array.isArray(torre.material))torre.material=materialesCaja(basePiedra,14,16,12);
  if(cornisaOriginal){cornisaOriginal.scale.set(14.7,0.4,12.7);cornisaOriginal.position.set(0,33.7,-7);}
  if(tejadoOriginal){tejadoOriginal.scale.set(1.52,1.4,1.4);tejadoOriginal.position.set(0,38.8,-7);}
  // Alas conectadas al bloque central y al cuerpo delantero.
  ala('Ala superior oeste',-10.5,-2,8,16,9);
  ala('Ala superior este',10.5,-2,8,16,9);
  ala('Cuerpo frontal superior',0,8,22,6,7);
  ala('Cuerpo posterior superior',0,-14,25,5,8);
  for(const y of [21.5,26.5,30.7])for(const x of [-4.5,0,4.5])ventana(x,y,-0.88);
  // Detalles de fachada y chimeneas, sin duplicar pisos sobre la cubierta.
  for(const x of [-8,8])caja('Chimenea superior',x,31,-5,0.8,3,0.9);
  for(const x of [-9,-4.5,0,4.5,9])caja('Pilastra frontal superior',x,21,11.15,0.28,6.7,0.25,baseMoldura);
  const informe={alas:4,torreCentral:{ancho:14,fondo:12,altura:16},transitable:false};
  castillo.userData.ampliacionSuperior=informe;
  // Se libera junto con los recursos originales si se llama userData.liberar().
  const liberarAnterior=castillo.userData.liberar;
  castillo.userData.liberar=()=>{
    for(const g of recursos.geometrias)g.dispose();for(const m of recursos.materiales)m.dispose();for(const t of recursos.texturas)t.dispose();
    liberarAnterior?.();
  };
  return informe;
}

exports.ampliarParteSuperior = ampliarParteSuperior;
},
"./inicioLejano.js": function(module, exports, __require) {
const THREE = __THREE;
const { CONFIG } = __require("./config.js");



// Reemplazo del modulo anterior: conserva inicio lejano y zonas de escaleras.
function configurarInicioLejano(camara,castillo) {
  const mundo=castillo.userData,altura=CONFIG.jugador.altura;
  const margen=Math.max(2,CONFIG.terreno.margenBorde??2);
  const extremo=CONFIG.terreno.largo/2-margen;
  const x=THREE.MathUtils.clamp(castillo.position.x,-CONFIG.terreno.ancho/2+margen,CONFIG.terreno.ancho/2-margen);
  mundo.prepararColisiones?.();
  let encontrado=null;
  for(let z=extremo;z>castillo.position.z+45;z-=1) {
    const y=mundo.alturaSuelo(x,z,0);
    if(Number.isFinite(y)&&!mundo.bloqueado(x,z,y,altura)){encontrado={x,y,z};break;}
  }
  if(!encontrado)throw new Error('No hay un inicio despejado sobre el eje frontal.');
  // El camino ya fue creado por crearEntornoMontana, antes de este modulo.
  const camino=castillo.parent.getObjectByName('Sendero en pendiente');
  if(!camino)throw new Error('No se encontro Sendero en pendiente. Conserva entornoMontana.js y su orden de inicializacion.');
  camino.geometry.computeBoundingBox();
  const caja=camino.geometry.boundingBox;
  const inicio=caja.min.z,ancho=caja.max.x-caja.min.x;
  const centroX=(caja.min.x+caja.max.x)/2;
  const final=Math.max(caja.max.z,Math.min(CONFIG.terreno.largo/2-0.5,encontrado.z+1));
  const longitud=final-inicio,segmentos=Math.ceil(longitud*2);
  const geo=new THREE.PlaneGeometry(ancho,longitud,1,segmentos);
  geo.rotateX(-Math.PI/2);geo.translate(centroX,0,(inicio+final)/2);
  const pos=geo.attributes.position,sueloAnterior=mundo.alturaSuelo;
  // Las coordenadas del sendero existente estan horneadas en espacio de mundo;
  // su mesh permanece con transformacion identidad, como en entornoMontana.js.
  for(let i=0;i<pos.count;i++){
    const px=pos.getX(i),pz=pos.getZ(i);
    pos.setY(i,sueloAnterior(px,pz,0)+0.035);
  }
  geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  const anterior=camino.geometry;camino.geometry=geo;anterior.dispose();
  camino.receiveShadow=true;camino.userData.longitudSendero=longitud;
  // ambienteAvanzado asigna la textura despues de crear el spawn.
  // Ajustarla antes de dibujar conserva la escala de adoquines del sendero de 36m.
  const antes=camino.onBeforeRender;
  camino.onBeforeRender=function(...args){
    const mapa=this.material?.map;
    if(mapa){mapa.repeat.set(2,longitud/2);mapa.updateMatrix();}
    antes?.apply(this,args);
  };
  const perfil=[];
  for(let i=0;i<pos.count;i+=2)perfil.push({z:pos.getZ(i),y:(pos.getY(i)+pos.getY(i+1))/2});
  perfil.sort((a,b)=>a.z-b.z);
  function alturaPavimento(z){
    const t=THREE.MathUtils.clamp((z-inicio)/longitud,0,1)*(perfil.length-1);
    const i=Math.min(perfil.length-2,Math.floor(t));
    return THREE.MathUtils.lerp(perfil[i].y,perfil[i+1].y,t-i);
  }
  mundo.alturaSuelo=(px,pz,pies)=>{
    let y=sueloAnterior(px,pz,pies);
    if(Math.abs(px-centroX)<=ancho/2&&pz>=inicio&&pz<=final){
      const pavimento=alturaPavimento(pz);
      if(pavimento<=pies+0.32)y=Math.max(y,pavimento);
    }
    return y;
  };
  encontrado.y=mundo.alturaSuelo(encontrado.x,encontrado.z,encontrado.y);
  camara.position.set(encontrado.x,encontrado.y+altura,encontrado.z);
  camara.lookAt(castillo.position.x,castillo.position.y+4.8,castillo.position.z+18);
  camara.updateMatrixWorld(true);
  mundo.esZonaEscalera=(px,pz,pies)=>{
    const lx=px-castillo.position.x,lz=pz-castillo.position.z,py=pies-castillo.position.y;
    const r=Math.hypot(lx,lz+7);
    return (r>=1.5&&r<=4.2&&py>=2.9&&py<17.45)||
      (Math.abs(lx)<=3.25&&lz>=18.2&&lz<=28.2&&py<3.2);
  };
  return {x:encontrado.x,z:encontrado.z,alturaSuelo:encontrado.y,
    camino:{desdeZ:inicio,hastaZ:final,longitud,ancho},
    nota:'Inicio exterior sobre el sendero; acercarse al porton y abrir con E.'};
}

exports.configurarInicioLejano = configurarInicioLejano;
},
"./techoYTerraza.js": function(module, exports, __require) {
const THREE = __THREE;


// Tras crearAccesosTresPisos y antes de los gestores y la agrupacion.
function corregirTechoYTerraza(castillo) {
  const obstaculos=castillo.userData.colisiones,puertas=castillo.userData.puertas;
  const pared=castillo.getObjectByName('Muro salon superior frente');
  if(!pared)throw new Error('Instala primero la actualizacion de escalera caracol y tres pisos.');
  const piedra=(Array.isArray(pared.material)?pared.material[0]:pared.material).clone();
  const moldura=piedra.clone();moldura.color.setHex(0xd5c5a1);
  const hierro=new THREE.MeshStandardMaterial({color:0x34352f,metalness:0.6,roughness:0.6});
  const madera=new THREE.MeshStandardMaterial({color:0x67412a,roughness:0.9});
  const dorado=new THREE.MeshStandardMaterial({color:0xcda758,metalness:0.55,roughness:0.5});
  const geo=new THREE.BoxGeometry(1,1,1),raiz=new THREE.Group();raiz.name='Techo reparado y terraza';castillo.add(raiz);
  function caja(nombre,x,y,z,w,h,d,material=piedra,colision=false) {
    const o=new THREE.Mesh(geo,material);o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;raiz.add(o);
    if(colision)obstaculos.push({mesh:o,w,h,d,esCaja:true});return o;
  }
  function quitar(o){for(let i=obstaculos.length-1;i>=0;i--)if(obstaculos[i].mesh===o)obstaculos.splice(i,1);o.removeFromParent();}
  // Sustituye la pared por dos paños y dintel: el vano queda realmente libre.
  quitar(pared);
  const anchoPuerta=2.6,altoPuerta=3.6,base=17.5,zPuerta=-1.1;
  for(const s of [-1,1])caja('Lateral puerta terraza',s*4.05,25.5,zPuerta,5.5,16,0.3,piedra,true);
  caja('Dintel puerta terraza',0,27.3,zPuerta,2.6,12.4,0.3,piedra,true);
  const marco=new THREE.Group();marco.position.set(0,base,zPuerta);raiz.add(marco);
  const pivote=new THREE.Group();pivote.position.x=-anchoPuerta/2;marco.add(pivote);
  const hoja=new THREE.Mesh(geo,madera);hoja.name='Puerta terraza';hoja.scale.set(anchoPuerta,altoPuerta,0.22);hoja.position.set(anchoPuerta/2,altoPuerta/2,0);pivote.add(hoja);
  obstaculos.push({mesh:hoja,w:anchoPuerta,h:altoPuerta,d:0.22,esCaja:true});
  for(const y of [0.55,3.05]){
    const b=new THREE.Mesh(geo,hierro);b.scale.set(2.45,0.14,0.28);b.position.set(1.3,y,0);pivote.add(b);
  }
  const manija=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),dorado);manija.position.set(2.35,1.65,0.2);pivote.add(manija);
  for(const x of [-1.43,1.43])caja('Marco acceso terraza',x,19.35,zPuerta,0.23,3.9,0.55,moldura);
  caja('Marco acceso terraza',0,21.25,zPuerta,3.1,0.25,0.55,moldura);
  puertas.push({nombre:'Acceso a la terraza',marco,pivote,hoja,ancho:2.6,alto:3.6,abierta:false,angulo:0});
  // Umbral solo en el espacio entre pisos, no otra losa encima de la cubierta.
  caja('Umbral terraza',0,17.38,-1.1,2.6,0.24,0.2,moldura);

  // Completa las esquinas del hueco cuadrado, conservando el paso circular.
  const vertices=[],uv=[];
  function tri(a,b,c){for(const v of [a,b,c]){vertices.push(...v);uv.push(v[0]/3,v[2]/3);}}
  function quad(a,b,c,d){tri(a,b,c);tri(a,c,d);}
  function punto(r,a,y){return [Math.cos(a)*r,y,-7+Math.sin(a)*r];}
  for(let i=0;i<96;i++) {
    const a=i*Math.PI*2/96,b=(i+1)*Math.PI*2/96;
    const r1=4.3/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
    const r2=4.3/Math.max(Math.abs(Math.cos(b)),Math.abs(Math.sin(b)));
    quad(punto(4.08,a,17.5),punto(4.08,b,17.5),punto(r2,b,17.5),punto(r1,a,17.5));
    quad(punto(r1,a,17.26),punto(r2,b,17.26),punto(4.08,b,17.26),punto(4.08,a,17.26));
    quad(punto(4.08,a,17.26),punto(4.08,b,17.26),punto(4.08,b,17.5),punto(4.08,a,17.5));
  }
  const tapaGeo=new THREE.BufferGeometry();tapaGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));tapaGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tapaGeo.computeVertexNormals();
  const tapaMat=moldura.clone();tapaMat.side=THREE.DoubleSide;
  const tapa=new THREE.Mesh(tapaGeo,tapaMat);tapa.name='Remate techo segundo piso';tapa.castShadow=tapa.receiveShadow=true;raiz.add(tapa);
  // Caja de escalera circular; abertura este para ambos descansos.
  for(let i=0;i<64;i++) {
    const a=(i+0.5)*Math.PI*2/64;
    if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<0.34)continue;
    const o=caja('Cerramiento caja escalera',Math.cos(a)*4.22,15.65,-7+Math.sin(a)*4.22,0.43,11.3,0.12,piedra,true);
    o.rotation.y=Math.PI/2-a;
  }
  // Cierra el paño este entre las dos salidas, sin bloquear los descansos.
  caja('Paño entre descansos',4.22,15.55,-7,0.14,3.9,2.8,piedra,true);
  const cubiertaGeo=new THREE.CylinderGeometry(4.3,4.3,0.25,64);
  const cubierta=new THREE.Mesh(cubiertaGeo,moldura);cubierta.position.set(0,21.425,-7);cubierta.name='Cubierta caja escalera';cubierta.castShadow=cubierta.receiveShadow=true;raiz.add(cubierta);
  // Barandas de una terraza frontal de 9 por 5 unidades, antes del cuerpo decorativo.
  function baranda(x,z,w,d) {
    const barrera=caja('Colision baranda terraza',x,18.05,z,w,1.1,d,hierro,true);barrera.visible=false;
    caja('Pasamanos terraza',x,18.6,z,w,0.1,d,hierro);
    const largo=Math.max(w,d),n=Math.ceil(largo/0.75);
    for(let i=0;i<=n;i++)caja('Balaustre terraza',x+(w>d?-largo/2+i*largo/n:0),18.02,z+(d>w?-largo/2+i*largo/n:0),0.07,1.04,0.07,hierro);
  }
  baranda(0,4,9,0.16);baranda(-4.5,1.5,0.16,5);baranda(4.5,1.5,0.16,5);
  // Mantiene el piso existente a 17.5: no se agrega una superficie coplanar encima.
  const sueloAnterior=castillo.userData.alturaSuelo;
  castillo.userData.alturaSuelo=(x,z,pies)=>{
    const lx=x-castillo.position.x,lz=z-castillo.position.z,py=pies-castillo.position.y;
    let h=sueloAnterior(x,z,pies);
    const remate=Math.abs(lx)<=4.3&&Math.abs(lz+7)<=4.3&&Math.hypot(lx,lz+7)>=4.08;
    const umbral=Math.abs(lx)<=1.3&&lz>=-1.2&&lz<=-1;
    const terraza=Math.abs(lx)<=4.5&&lz>=-1&&lz<=4;
    if(py+0.32>=17.5&&(remate||umbral||terraza))h=Math.max(h,17.5+castillo.position.y);
    return h;
  };
  castillo.userData.terraza={puerta:'Acceso a la terraza',piso:17.5,ancho:9,fondo:5};
  return castillo.userData.terraza;
}

exports.corregirTechoYTerraza = corregirTechoYTerraza;
},
"./oclusionHabitaciones.js": function(module, exports, __require) {
const THREE = __THREE;


// Portal culling CPU para la distribucion de 8 habitaciones del castillo jugable.
// Oculta contenidos, no la estructura compartida ni los datos de colision.
function crearOclusionHabitaciones(escena,camara,castillo) {
  const habitaciones=[],celdas=new Map(),portales=[];
  const registros=[],frustum=new THREE.Frustum(),matriz=new THREE.Matrix4();
  const inversa=new THREE.Matrix4(),ojoLocal=new THREE.Vector3(),ojo=new THREE.Vector3();
  const nombres=['Biblioteca','Comedor','Armeria','Sala del consejo',
    'Dormitorio oeste','Dormitorio este','Estudio','Sala de mapas'];
  function celda(id,caja=null) {
    const c={id,caja,portales:[],habitacion:null};celdas.set(id,c);return c;
  }
  const exterior=celda('exterior');
  const volumen=(x1,y1,z1,x2,y2,z2)=>new THREE.Box3(new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2));
  celda('corredor-bajo',volumen(-7,3,-18,7,10,18));
  celda('corredor-alto',volumen(-7,10,-18,7,17.5,18));
  let indice=0;
  for(const base of [3,10])for(const atras of [false,true])for(const lado of [-1,1]) {
    const id=nombres[indice++];
    const box=volumen(lado<0?-20:7,base,atras?-18:-2,lado<0?-7:20,base+7,atras?-2:18);
    const c=celda(id,box);c.habitacion={id,caja:box,objetos:[],visible:true};habitaciones.push(c.habitacion);
    const x=lado*7,z=atras?-10:8;
    const puerta=castillo.userData.puertas?.find(p=>p.nombre===id);
    // Si falta una puerta en un proyecto modificado, se considera un paso abierto.
    conectar(id,base===3?'corredor-bajo':'corredor-alto',[
      [x,base,z-1.3],[x,base+3.6,z-1.3],[x,base+3.6,z+1.3],[x,base,z+1.3]
    ],puerta);
  }
  const salon=celda('Salon superior',volumen(-6.7,17.5,-12.7,6.7,34,-1.3));
  salon.habitacion={id:'Salon superior',caja:salon.caja,objetos:[],visible:true};
  habitaciones.push(salon.habitacion);
  celda('Terraza frontal',volumen(-4.5,17.5,-1.3,4.5,24,5));
  celda('Pabellon frontal',volumen(-10.7,17.5,5,10.7,24.5,11));
  celda('Balcon exterior',volumen(-10.5,17.5,11,10.5,25,17.4));
  conectar('corredor-alto','Salon superior',[
    [-4.3,17.5,-11.3],[4.3,17.5,-11.3],[4.3,17.5,-2.7],[-4.3,17.5,-2.7]
  ]);
  const vano=(z)=>[[-1.3,17.5,z],[1.3,17.5,z],[1.3,21.1,z],[-1.3,21.1,z]];
  const puertaNombre=n=>castillo.userData.puertas.find(p=>p.nombre===n);
  conectar('Salon superior','Terraza frontal',vano(-1.1),puertaNombre('Acceso a la terraza'));
  conectar('Terraza frontal','Pabellon frontal',vano(5),puertaNombre('Entrada pabellon frontal'));
  conectar('Pabellon frontal','Balcon exterior',vano(11),puertaNombre('Salida pabellon frontal'));
  conectar('exterior','Balcon exterior',[
    [-10.5,17.5,17.4],[10.5,17.5,17.4],[10.5,25,17.4],[-10.5,25,17.4]
  ]);
  conectar('exterior','Balcon exterior',[
    [-10.5,25,11],[10.5,25,11],[10.5,25,17.4],[-10.5,25,17.4]
  ]);
  conectar('exterior','Terraza frontal',[
    [-4.5,24,-1],[4.5,24,-1],[4.5,24,5],[-4.5,24,5]
  ]);
  function conectar(a,b,puntos,puerta=null) {
    const p={a,b,local:puntos.map(v=>new THREE.Vector3(...v)),puerta,mundo:[],plano:new THREE.Plane(),umbral:new THREE.Box3()};
    portales.push(p);celdas.get(a).portales.push(p);celdas.get(b).portales.push(p);
  }
  conectar('exterior','corredor-bajo',[
    [-1.3,3,18],[1.3,3,18],[1.3,6.6,18],[-1.3,6.6,18]
  ],castillo.userData.puertas?.find(p=>p.nombre==='Entrada principal'));
  // Hueco real entre las galerias; comunica las plantas por la escalera.
  conectar('corredor-bajo','corredor-alto',[
    [-4.3,10,-11.3],[4.3,10,-11.3],[4.3,10,-2.7],[-4.3,10,-2.7]
  ]);
  const cajaMundo=new THREE.Box3(),cajaLocal=new THREE.Box3();
  castillo.updateWorldMatrix(true,false);inversa.copy(castillo.matrixWorld).invert();
  const esContenido=/^(Mesa|Armario|Estanteria|Libros|Cama|Cabecera)(\s|$)/i;
  castillo.traverse(o=>{
    if(!o.isMesh)return;
    let h=habitaciones.find(h=>h.id===o.userData.habitacion);
    if(!h&&!esContenido.test(o.name))return;
    if(!h) {
      cajaMundo.setFromObject(o);cajaLocal.copy(cajaMundo).applyMatrix4(inversa);
      h=habitaciones.find(h=>h.caja.clone().expandByScalar(0.06).containsBox(cajaLocal));
    }
    if(h){const r={objeto:o,visibleInicial:o.visible};h.objetos.push(r);registros.push(r);}
  });
  function recortar(poligono,planos) {
    let salida=poligono;
    for(const plano of planos) {
      if(!salida.length)return salida;
      const entrada=salida;salida=[];
      for(let i=0;i<entrada.length;i++) {
        const a=entrada[i],b=entrada[(i+1)%entrada.length];
        const da=plano.distanceToPoint(a),db=plano.distanceToPoint(b);
        const dentroA=da>=-0.0001,dentroB=db>=-0.0001;
        if(dentroA)salida.push(a);
        if(dentroA!==dentroB)salida.push(a.clone().lerp(b,da/(da-db)));
      }
    }
    return salida;
  }
  function planosPortal(poligono,anteriores) {
    const centro=new THREE.Vector3();for(const p of poligono)centro.add(p);centro.multiplyScalar(1/poligono.length);
    const resultado=anteriores.slice();
    for(let i=0;i<poligono.length;i++) {
      const a=poligono[i],b=poligono[(i+1)%poligono.length];
      const normal=new THREE.Vector3().crossVectors(a.clone().sub(ojo),b.clone().sub(ojo));
      if(normal.lengthSq()<1e-12)continue;
      const plano=new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(),ojo);
      if(plano.distanceToPoint(centro)<0)plano.negate();
      resultado.push(plano);
    }
    return resultado;
  }
  // Puertas y elementos animados conservan su estado; la compuerta solo controla el render.
  const raicesPorNombre=new Map([
    ['Biblioteca castillo oscuro','Biblioteca'],['Pantallas biblioteca','Biblioteca'],
    ['Comedor rompecabezas','Comedor'],['Boticario Armeria','Armeria'],
    ['Consejo · Biblioteca de los versos','Sala del consejo'],
    ['Observatorio de los deseos','Dormitorio oeste'],
    ['Sala de los deseos · Un hogar para imaginar','Dormitorio este'],
    ['Estudio de las pequeñas maravillas','Estudio'],
    ['Sala de mapas · Galería de recuerdos','Sala de mapas']
  ]);
  const candidatas=[];
  castillo.traverse(o=>{if(raicesPorNombre.has(o.name))candidatas.push(o);});
  const compuertas=[];
  for(const raiz of candidatas){
    const habitacion=habitaciones.find(h=>h.id===raicesPorNombre.get(raiz.name));
    if(!habitacion||!raiz.parent)continue;
    const padre=raiz.parent,gate=new THREE.Group();
    gate.name='Visibilidad · '+raiz.name;gate.userData.occlusionGate=true;
    padre.add(gate);gate.add(raiz);compuertas.push({gate,raiz,padre,habitacion});
  }
  // No sobrescribir la visibilidad de partículas, pantallas u objetos animados internos.
  const bajoCompuerta=o=>{for(let p=o.parent;p;p=p.parent)if(p.userData.occlusionGate)return true;return false;};
  for(const h of habitaciones)h.objetos=h.objetos.filter(r=>!bajoCompuerta(r.objeto));
  const matrizCastillo=new THREE.Matrix4();let portalesListos=false;
  function actualizarPortales(){
    if(portalesListos&&matrizCastillo.equals(castillo.matrixWorld))return;
    matrizCastillo.copy(castillo.matrixWorld);portalesListos=true;
    for(const p of portales){
      p.mundo=p.local.map(v=>v.clone().applyMatrix4(matrizCastillo));
      p.plano.setFromCoplanarPoints(p.mundo[0],p.mundo[1],p.mundo[2]);
      p.umbral.setFromPoints(p.mundo).expandByScalar(.4);
    }
  }
  const ultimas=new Map();let tiempo=0;
  const estadisticas={zona:'exterior',habitacionesVisibles:[],habitacionesOcultas:[],objetosGestionados:registros.length,objetosOcultos:0,habilitado:true};
  function actualizar(dt=0) {
    tiempo+=dt;
    castillo.updateWorldMatrix(true,false);camara.updateMatrixWorld(true);
    camara.getWorldPosition(ojo);inversa.copy(castillo.matrixWorld).invert();ojoLocal.copy(ojo).applyMatrix4(inversa);
    matriz.multiplyMatrices(camara.projectionMatrix,camara.matrixWorldInverse);frustum.setFromProjectionMatrix(matriz);
    let origen=exterior;
    // En el umbral se evalua tambien la celda vecina para evitar desapariciones.
    for(const c of celdas.values())if(c.caja?.containsPoint(ojoLocal)){origen=c;break;}
    estadisticas.zona=origen.id;actualizarPortales();
    const visibles=new Set();
    function visitar(id,planos,camino,profundidad) {
      if(profundidad>12)return;
      visibles.add(id);
      const siguienteCamino=new Set(camino);siguienteCamino.add(id);
      for(const p of celdas.get(id).portales) {
        const destino=p.a===id?p.b:p.a;
        if(siguienteCamino.has(destino))continue;
        const mundo=p.mundo,plano=p.plano,box=p.umbral;
        const enUmbral=box.containsPoint(ojo);
        // angulo real, no solo la orden de apertura: respeta el cierre animado.
        if(p.puerta&&Math.abs(p.puerta.angulo??p.puerta.pivote.rotation.y)<0.01&&!enUmbral)continue;
        if(enUmbral||Math.abs(plano.distanceToPoint(ojo))<0.04) {
          visitar(destino,planos,siguienteCamino,profundidad+1);continue;
        }
        const recortado=recortar(mundo,planos);
        if(recortado.length>=3)visitar(destino,planosPortal(recortado,planos),siguienteCamino,profundidad+1);
      }
    }
    if(estadisticas.habilitado)visitar(origen.id,frustum.planes, new Set(),0);
    estadisticas.habitacionesVisibles=[];estadisticas.habitacionesOcultas=[];estadisticas.objetosOcultos=0;
    for(const h of habitaciones) {
      const visible=!estadisticas.habilitado||visibles.has(h.id);
      if(visible)ultimas.set(h.id,tiempo);
      // Retardo de 150 ms al ocultar, nunca al mostrar.
      h.visible=visible||tiempo-(ultimas.get(h.id)??-100)<0.15;
      (h.visible?estadisticas.habitacionesVisibles:estadisticas.habitacionesOcultas).push(h.id);
      for(const r of h.objetos){r.objeto.visible=r.visibleInicial&&h.visible;if(!r.objeto.visible&&r.visibleInicial)estadisticas.objetosOcultos++;}
    }
    for(const c of compuertas)c.gate.visible=c.habitacion.visible;
  }
  return {actualizar,estadisticas,habitaciones,
    activar(valor){estadisticas.habilitado=Boolean(valor);actualizar();},
    liberar(){for(const r of registros)r.objeto.visible=r.visibleInicial;for(const c of compuertas){c.padre.add(c.raiz);c.gate.removeFromParent();}}
  };
}

exports.crearOclusionHabitaciones = crearOclusionHabitaciones;
},
"./controles.js": function(module, exports, __require) {
const THREE = __THREE;
const PointerLockControls = __PointerLockControls;
const { CONFIG } = __require("./config.js");
const { crearControlesTactiles } = __require("./controlesTactiles.js");





function crearControles (camara, elemento, mundo) {
  const control = new PointerLockControls (camara, elemento);
  const teclas = new Set();
  control.pointerSpeed = 0.8; 
  control.minPolarAngle = Math.PI * 0.05; 
  control.maxPolarAngle = Math.PI * 0.95;

  const menu = document.getElementById('menu');
  const boton = document.getElementById('boton-iniciar');
  const mira = document.getElementById('mira');
  const estado = document.getElementById('estado');
  const ayuda = document.getElementById('ayuda');

  let modoTactil = window.matchMedia('(pointer: coarse)').matches;
  let activoTactil = false;

  const aviso = document.createElement('div');
  aviso.style.cssText = 'position:fixed;top:54%;left:50%;transform:translateX(-50%);color:white;background:#0009;padding:7px 12px;border-radius:6px;pointer-events:none;z-index:6;font:13px Arial;max-width:85%;text-align:center;display:none';
  document.body.appendChild(aviso);

  const altura = CONFIG.jugador.altura;
  const ajustes = { 
    escalonMaximo: 0.30, 
    suavizadoVertical: 18, // Suavizado gradual para la altura de cámara
    gravedad: 18, 
    velocidadEscaleras: 2.4, 
    transicionVelocidad: 12, 
    sensibilidadTactil: 0.003 
  };

  const diagnostico = { rechazosAltura: 0, ultimoRechazo: null, enEscalera: false, velocidadActual: 0 };

  let pies = camara.position.y - altura;
  let caida = 0;
  let volando = false;
  let mensajeTemporal = '';
  let tiempoMensaje = 0;
  let velocidadActual = 0;

  const frente = new THREE.Vector3();
  const derecha = new THREE.Vector3();
  const direccion = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  const tactil = crearControlesTactiles(accion => {
    if (!activoTactil) return;
    if (accion === 'puerta') mundo.interactuar(camara);
    if (accion === 'vuelo') alternarVuelo();
    if (accion === 'menu') pausar();
  });

  elemento.style.touchAction = 'none';
  elemento.addEventListener('contextmenu', e => { if (modoTactil) e.preventDefault(); });

  function activo() { return modoTactil ? activoTactil : control.isLocked; }

  function mostrarJuego (valor) {
    if (menu) menu.hidden = valor;
    if (mira) mira.hidden = !valor;
    if (estado && valor) estado.textContent = '';
    tactil.setActivo(modoTactil && valor);
    if (ayuda) ayuda.textContent = modoTactil 
      ? 'Joystick: caminar\nDerecha: mirar\nE: puertas\nF: vuelo' 
      : 'WASD: mover\nShift: correr\nEspacio/Ctrl: subir/bajar\nEsc: menú';
    if (!valor) { teclas.clear(); velocidadActual = 0; aviso.style.display = 'none'; }
  }

  function sueloValido (x, z, referencia) {
    const y = mundo.alturaSuelo(x, z, referencia);
    return Number.isFinite(y) ? y : null;
  }

  function alternarVuelo() {
    if (!volando) {
      volando = true; caida = 0; velocidadActual = 0;
      pies = camara.position.y - altura;
      tactil.setVuelo(true);
      return;
    }
    const actual = camara.position.y - altura;
    if (mundo.bloqueado(camara.position.x, camara.position.z, actual, altura)) {
      mensajeTemporal = 'Sal del muro o del objeto antes de aterrizar';
      tiempoMensaje = 2;
      return;
    }
    volando = false; pies = actual; caida = 0; velocidadActual = 0;
    tactil.setVuelo(false);
  }

  boton?.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') modoTactil = true;
    else if (e.pointerType === 'mouse' && !window.matchMedia('(pointer: coarse)').matches) modoTactil = false;
  });

  boton?.addEventListener('click', () => {
    if (modoTactil) {
      if (control.isLocked) control.unlock();
      activoTactil = true; mostrarJuego(true);
    } else {
      control.lock();
    }
  });

  control.addEventListener('lock', () => mostrarJuego(true));
  control.addEventListener('unlock', () => { if (!modoTactil) mostrarJuego(false); });

  document.addEventListener('pointerlockerror', () => {
    if (!modoTactil && estado) estado.textContent = 'No se pudo capturar el mouse. Abre el juego en el navegador y vuelve a pulsar Entrar.';
  });

  document.addEventListener('keydown', e => {
    if (!activo()) return;
    if (e.code === 'Escape' && modoTactil) { e.preventDefault(); pausar(); return; }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyE', 'Space', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
      e.preventDefault();
      teclas.add(e.code);
    }
    if (e.repeat) return;
    if (e.code === 'KeyF') alternarVuelo();
    if (e.code === 'KeyE') mundo.interactuar(camara);
  });

  document.addEventListener('keyup', e => teclas.delete(e.code));

  function pausar() {
    teclas.clear(); tactil.reiniciar(); activoTactil = false;
    if (control.isLocked) control.unlock();
    mostrarJuego(false);
  }

  window.addEventListener('blur', pausar);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

  // [REPARACIÓN DE CÁMARA]: Transición fluida de los pies durante el desplazamiento
  function mover (dx, dz, dt) {
    if (Math.abs(dx) + Math.abs(dz) < 1e-10) return;
    const x = camara.position.x + dx, z = camara.position.z + dz;
    if (Math.abs(x) > CONFIG.terreno.ancho / 2 - 1 || Math.abs(z) > CONFIG.terreno.largo / 2 - 1) return;
    const suelo = sueloValido(x, z, pies);
    if (suelo === null) return;

    if (suelo - pies > ajustes.escalonMaximo + 0.0001) {
      diagnostico.rechazosAltura++;
      diagnostico.ultimoRechazo = { desde: pies, hasta: suelo, x, z };
      return;
    }

    const nuevo = Math.max(suelo, pies);
    if (!mundo.bloqueado(x, z, nuevo, altura)) {
      camara.position.x = x;
      camara.position.z = z;
      if (suelo > pies) {
        // En lugar de pies = suelo (salto brusco), suavizamos progresivamente
        pies = THREE.MathUtils.damp(pies, suelo, ajustes.suavizadoVertical, dt);
        caida = 0;
      }
    }
  }

  function vertical (dt) {
    const suelo = sueloValido(camara.position.x, camara.position.z, pies);
    if (suelo === null) return;
    const d = suelo - pies;

    if (d > ajustes.escalonMaximo + 0.0001) { caida = 0; return; }

    if (d >= -0.015) {
      pies = THREE.MathUtils.damp(pies, suelo, ajustes.suavizadoVertical, dt);
      caida = 0;
      return;
    }

    caida += ajustes.gravedad * dt;
    pies = Math.max(suelo, pies - caida * dt);
    if (Math.abs(pies - suelo) < 0.001) { pies = suelo; caida = 0; }
  }

  function actualizar (dt) {
    if (!activo()) return;
    dt = Math.max(0, Math.min(dt, 0.05));
    tiempoMensaje = Math.max(0, tiempoMensaje - dt);
    const t = tactil.estado;

    if (modoTactil) {
      euler.setFromQuaternion(camara.quaternion, 'YXZ');
      euler.y -= t.mirarX * ajustes.sensibilidadTactil;
      euler.x = THREE.MathUtils.clamp(euler.x - t.mirarY * ajustes.sensibilidadTactil, -Math.PI * 0.45, Math.PI * 0.45);
      camara.quaternion.setFromEuler(euler);
      t.mirarX = t.mirarY = 0;
    }

    const a = Number(teclas.has('KeyW')) - Number(teclas.has('KeyS')) + (modoTactil ? t.y : 0);
    const l = Number(teclas.has('KeyD')) - Number(teclas.has('KeyA')) + (modoTactil ? t.x : 0);
    const rapido = teclas.has('ShiftLeft') || teclas.has('ShiftRight') || (modoTactil && t.correr);

    camara.getWorldDirection(frente);
    derecha.crossVectors(frente, camara.up).normalize();

    if (volando) {
      const v = Number(teclas.has('Space') || (modoTactil && t.subir)) - Number(teclas.has('ControlLeft') || teclas.has('ControlRight') || (modoTactil && t.bajar));
      direccion.copy(frente).multiplyScalar(a).addScaledVector(derecha, l);
      direccion.y += v;
      const longitud = direccion.length();
      if (longitud > 0) camara.position.addScaledVector(direccion.normalize(), dt * (rapido ? 26 : 12) * Math.min(1, longitud));
      camara.position.x = THREE.MathUtils.clamp(camara.position.x, -CONFIG.terreno.ancho / 2 + 1, CONFIG.terreno.ancho / 2 - 1);
      camara.position.z = THREE.MathUtils.clamp(camara.position.z, -CONFIG.terreno.largo / 2 + 1, CONFIG.terreno.largo / 2 - 1);
      const base = sueloValido(camara.position.x, camara.position.z, 0) ?? 0;
      camara.position.y = THREE.MathUtils.clamp(camara.position.y, base + altura, 120);
      pies = camara.position.y - altura;
      diagnostico.enEscalera = false;
    } else {
      frente.y = 0; 
      frente.normalize();
      const n = Math.hypot(a, l), intensidad = Math.min(1, n);
      const ux = n ? (frente.x * a + derecha.x * l) / n : 0;
      const uz = n ? (frente.z * a + derecha.z * l) / n : 0;

      const enEscalera = Boolean(
        mundo.esZonaEscalera?.(camara.position.x, camara.position.z, pies) ||
        mundo.esZonaEscalera?.(camara.position.x + ux * 0.25, camara.position.z + uz * 0.25, pies)
      );
      diagnostico.enEscalera = enEscalera;

      const objetivo = intensidad * (enEscalera ? ajustes.velocidadEscaleras : CONFIG.jugador.velocidad * (rapido ? CONFIG.jugador.multiplicadorCarrera : 1));
      velocidadActual = THREE.MathUtils.damp(velocidadActual, objetivo, ajustes.transicionVelocidad, dt);
      if (enEscalera) velocidadActual = Math.min(velocidadActual, ajustes.velocidadEscaleras);
      diagnostico.velocidadActual = velocidadActual;

      const dx = ux * velocidadActual * dt, dz = uz * velocidadActual * dt;
      const pasos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.06));

      for (let i = 0; i < pasos; i++) {
        mover(dx / pasos, 0, dt / pasos);
        mover(0, dz / pasos, dt / pasos);
        vertical(dt / pasos);
      }

      // Sincronización continua de la cámara con los pies
      camara.position.y = THREE.MathUtils.damp(camara.position.y, pies + altura, ajustes.suavizadoVertical, dt);
      camara.position.y = Math.max(camara.position.y, pies + 0.5);
    }

    mundo.actualizar(dt, camara, pies);
    const p = mundo.puertaCercana(camara);
    tactil.setVuelo(volando);
    if (modoTactil) tactil.setPuerta(p);

    const texto = tiempoMensaje > 0 ? mensajeTemporal : p ? `${modoTactil ? 'Puerta' : 'E'} • ${p.abierta ? 'Cerrar' : 'Abrir'} ${p.nombre}` : volando ? `${modoTactil ? 'Vuelo libre' : 'Vuelo libre • Espacio/Ctrl F: aterrizar'}` : '';
    aviso.style.display = texto ? 'block' : 'none';
    if (aviso.textContent !== texto) aviso.textContent = texto;
  }

  return { actualizar, get volando() { return volando; }, get pies() { return pies; }, get modoTactil() { return modoTactil; }, alternarVuelo, ajustes, diagnostico, pausar };
}
exports.crearControles = crearControles;
},
"./ambienteAvanzado.js": function(module, exports, __require) {
const THREE = __THREE;


function crearAmbienteAvanzado(escena,camara,castillo,entorno,ciclo) {
  let semilla=123;
  const azar=()=>{semilla=(Math.imul(1664525,semilla)+1013904223)>>>0;return semilla/4294967296;};
  function canvas(n=256){const c=document.createElement('canvas');c.width=c.height=n;return [c,c.getContext('2d')];}
  function mapa(tipo) {
    const [c,x]=canvas();
    x.fillStyle=tipo==='corteza'?'#735336':tipo==='hojas'?'#597949':'#8e8a7a';x.fillRect(0,0,256,256);
    if(tipo==='adoquin') {
      x.fillStyle='#45483f';x.fillRect(0,0,256,256);
      for(let f=0;f<8;f++)for(let j=-1;j<5;j++) {
        const v=110+Math.floor(azar()*50);x.fillStyle=`rgb(${v+10},${v+5},${v-5})`;
        x.fillRect(j*64+(f%2)*32+2,f*32+2,59,27);
      }
    } else for(let i=0;i<1800;i++) {
      const v=azar();x.fillStyle=tipo==='corteza'?`rgba(30,17,5,${v*0.4})`:tipo==='hojas'?`rgba(${20+Math.floor(v*60)},${65+Math.floor(v*65)},25,0.5)`:`rgba(${v>0.5?210:40},${v>0.5?210:40},${v>0.5?190:35},0.2)`;
      const px=azar()*256,py=azar()*256;
      if(tipo==='corteza')x.fillRect(px,py,1+azar()*3,12+azar()*55);
      else{x.beginPath();x.ellipse(px,py,2+azar()*8,1+azar()*5,azar()*3,0,Math.PI*2);x.fill();}
    }
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  }
  const texturas={corteza:mapa('corteza'),hojas:mapa('hojas'),roca:mapa('roca'),adoquin:mapa('adoquin')};
  texturas.corteza.repeat.set(2,3);texturas.hojas.repeat.set(3,3);texturas.roca.repeat.set(2,2);texturas.adoquin.repeat.set(2,18);
  const usados=new Set();
  escena.traverse(o=>{
    let tipo=null;
    if(o.name.startsWith('Vegetacion '))tipo=o.name.endsWith('tronco')?'corteza':o.name.endsWith('roca')?'roca':'hojas';
    if(o.name==='Sendero en pendiente')tipo='adoquin';
    if(!tipo||!o.material)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(usados.has(m))continue;usados.add(m);m.map=texturas[tipo];m.color.setHex(0xffffff);m.roughness=0.95;m.needsUpdate=true;
    }
  });
  function disco(luna=false) {
    const [c,x]=canvas();x.clearRect(0,0,256,256);
    x.fillStyle=luna?'#d8dfeb':'#fff0b0';x.beginPath();x.arc(128,128,103,0,Math.PI*2);x.fill();
    if(luna)for(let i=0;i<40;i++) {x.fillStyle='rgba(75,88,110,0.20)';x.beginPath();const a=azar()*Math.PI*2,r=Math.sqrt(azar())*80;x.arc(128+Math.cos(a)*r,128+Math.sin(a)*r,3+azar()*12,0,Math.PI*2);x.fill();}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  const solSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:disco(),transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  const lunaSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:disco(true),transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  solSprite.scale.set(13,13,1);lunaSprite.scale.set(10,10,1);escena.add(solSprite,lunaSprite);
  const estrellaPos=[];
  for(let i=0;i<650;i++) {
    const a=azar()*Math.PI*2,y=0.03+azar()*0.97,r=Math.sqrt(1-y*y);
    estrellaPos.push(Math.cos(a)*r*210,y*210,Math.sin(a)*r*210);
  }
  const estrellasGeo=new THREE.BufferGeometry();estrellasGeo.setAttribute('position',new THREE.Float32BufferAttribute(estrellaPos,3));
  const estrellas=new THREE.Points(estrellasGeo,new THREE.PointsMaterial({color:0xe3eaff,size:0.65,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false}));escena.add(estrellas);
  const [cc,cx]=canvas(64),grad=cx.createRadialGradient(32,32,0,32,32,30);
  grad.addColorStop(0,'rgba(255,255,210,1)');grad.addColorStop(0.2,'rgba(200,255,95,0.9)');grad.addColorStop(1,'rgba(160,255,30,0)');cx.fillStyle=grad;cx.fillRect(0,0,64,64);
  const brillo=new THREE.CanvasTexture(cc);brillo.colorSpace=THREE.SRGBColorSpace;
  const grupos=new Map();
  for(let i=0;i<180;i++) {
    const x=(azar()-0.5)*140,z=(azar()-0.5)*140;
    if(Math.abs(x)<29&&z>-45&&z<27)continue;
    const k=`${Math.floor(x/24)},${Math.floor(z/24)}`;
    if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push({x,y:entorno.altura(x,z)+1+azar()*2,z,fase:azar()*6.28});
  }
  const enjambres=[];
  for(const items of grupos.values()) {
    const g=new THREE.BufferGeometry(),v=new Float32Array(items.length*3);
    items.forEach((p,i)=>v.set([p.x,p.y,p.z],i*3));g.setAttribute('position',new THREE.BufferAttribute(v,3));g.computeBoundingSphere();g.boundingSphere.radius+=2;
    const m=new THREE.PointsMaterial({map:brillo,color:0xd9ff85,size:0.5,transparent:true,depthWrite:false,opacity:0,blending:THREE.AdditiveBlending,toneMapped:false});
    const points=new THREE.Points(g,m);escena.add(points);enjambres.push({points,items});
  }
  const lamparasMat=new THREE.MeshStandardMaterial({color:0xffd28b,emissive:0xffae45,emissiveIntensity:0.1});
  const lamparaGeo=new THREE.BoxGeometry(0.28,0.6,0.28);
  for(const [x,y,z] of [[-2,5,18.6],[2,5,18.6],[-2,3,43.4],[2,3,43.4]]) {
    const o=new THREE.Mesh(lamparaGeo,lamparasMat);o.position.set(x,y,z);castillo.add(o);
  }
  const lucesExterior=[];
  for(const [y,z] of [[5,19.4],[3,42.8]]) {
    const luz=new THREE.PointLight(0xffc579,0,14,2);luz.position.set(0,y,z);castillo.add(luz);lucesExterior.push(luz);
  }
  const emisivos=new Set();castillo.traverse(o=>{
    if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])
      if(m?.emissive&&m.name!== 'ignorar'&&m.emissive.g>m.emissive.r*1.5&&m.emissive.g>0.1)emisivos.add(m);
  });
  // Se crean despues del gestor dinamico; sus luces no son absorbidas por el pool.
  const pool=[];escena.traverse(o=>{if(o.isPointLight&&o.name.startsWith('Luz interior dinamica '))pool.push(o);});
  const intensidades=new Map();
  const panel=document.createElement('div');panel.style.cssText='position:fixed;top:12px;right:12px;padding:9px 12px;background:#101725bf;color:#fff;border-radius:8px;font:13px Arial;pointer-events:none;z-index:7';document.body.appendChild(panel);
  let tiempo=0,relojParticulas=0;
  const target=new THREE.Vector3(),direccion=new THREE.Vector3();
  function prepararLuces(){for(const l of pool)if(intensidades.has(l))l.intensity=intensidades.get(l);}
  function actualizar(dt) {
    tiempo+=dt;relojParticulas+=dt;const moverParticulas=relojParticulas>=1/24;if(moverParticulas)relojParticulas=0;const hora=((ciclo.ajustes.hora%24)+24)%24,a=(hora-6)/24*Math.PI*2;
    const noche=1-THREE.MathUtils.smoothstep(Math.sin(a),-0.1,0.18);
    direccion.set(Math.cos(a)*80,Math.sin(a)*100,Math.cos(a)*35).normalize();
    camara.getWorldPosition(target);
    solSprite.position.copy(target).addScaledVector(direccion,180);solSprite.visible=direccion.y>-0.03;
    lunaSprite.position.copy(target).addScaledVector(direccion,-180);lunaSprite.visible=direccion.y<0.03;lunaSprite.material.opacity=0.4+0.6*noche;
    estrellas.position.copy(target);estrellas.material.opacity=noche;estrellas.visible=noche>0.01;
    for(const e of enjambres) {
      e.points.visible=noche>0.02&&e.points.geometry.boundingSphere.center.distanceTo(camara.position)<45+e.points.geometry.boundingSphere.radius;e.points.material.opacity=noche*(0.7+0.3*Math.sin(tiempo*1.7));
      if(!e.points.visible||!moverParticulas)continue;
      const pos=e.points.geometry.attributes.position;
      e.items.forEach((p,i)=>pos.setXYZ(i,p.x+Math.sin(tiempo*0.7+p.fase)*0.7,p.y+Math.sin(tiempo+p.fase)*0.4,p.z+Math.cos(tiempo*0.6+p.fase)*0.7));pos.needsUpdate=true;
    }
    for(const l of pool){intensidades.set(l,l.intensity);l.intensity*=0.35+0.65*noche;}
    for(const l of lucesExterior)l.intensity=55*noche;
    lamparasMat.emissiveIntensity=0.1+2*noche;
    for(const m of emisivos)m.emissiveIntensity=0.15+1.8*noche;
    const esDia=hora>=6&&hora<18;
    const horasFaltantes=esDia?18-hora:hora<6?6-hora:30-hora;
    const segundos=Math.ceil(horasFaltantes/24*Math.max(30,ciclo.ajustes.duracionSegundos));
    const textoPanel=`${String(Math.floor(hora)).padStart(2,'0')}:${String(Math.floor((hora%1)*60)).padStart(2,'0')} · ${esDia?'Anochece':'Amanece'} en ${Math.floor(segundos/60)}:${String(segundos%60).padStart(2,'0')}${ciclo.ajustes.pausado?' · Pausado':''}`;if(panel.textContent!==textoPanel)panel.textContent=textoPanel;
  }
  return {prepararLuces,actualizar};
}

exports.crearAmbienteAvanzado = crearAmbienteAvanzado;
},
"./salaDeseosHogar.js": function(module, exports, __require) {
const THREE = __THREE;


const FAMILIA_SALA_DESEOS = Object.freeze([
  {
    "altura": 1.2,
    "piel": "#cda383",
    "ropa": "#527c86",
    "pelo": "#45342d"
  },
  {
    "altura": 1.13,
    "piel": "#b98769",
    "ropa": "#ba7e78",
    "pelo": "#362b2a"
  },
  {
    "altura": 0.78,
    "piel": "#c79878",
    "ropa": "#d1aa60",
    "pelo": "#46352d"
  },
  {
    "altura": 0.66,
    "piel": "#c39275",
    "ropa": "#8d9b78",
    "pelo": "#514030"
  }
]);

// El deseo solo existe en el textarea mientras se escribe. Nunca se copia al modelo,
// a la API pública, a una textura, a un registro ni a un almacenamiento persistente.
function crearSalaDeseosHogar(escena,camara,castillo,elemento,opciones={}){
  if(castillo.userData.salaDeseosHogar)return castillo.userData.salaDeseosHogar;
  const ROOM='Dormitorio este',raiz=new THREE.Group();raiz.name='Sala de los deseos · Un hogar para imaginar';castillo.add(raiz);
  const geometrias=new Set(),materiales=new Set(),texturas=new Set(),propios=[],ocultos=[],retirados=[];
  const colisiones=castillo.userData.colisiones;
  const geoCaja=new THREE.BoxGeometry(1,1,1),geoEsfera=new THREE.SphereGeometry(1,18,12);geometrias.add(geoCaja);geometrias.add(geoEsfera);
  const marcar=o=>{Object.assign(o.userData,{habitacion:ROOM,noAgrupar:true,dinamico:true});return o;};marcar(raiz);
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.83,...extra});materiales.add(m);return m;}
  const crema=material('#e6d7bd'),oro=material('#c3a365',{metalness:.48,roughness:.42}),madera=material('#664c3b'),azul=material('#577382'),tela=material('#ad7f78');
  function caja(nombre,x,y,z,w,h,d,mat,padre=raiz,solido=false){const o=marcar(new THREE.Mesh(geoCaja,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;padre.add(o);if(solido&&Array.isArray(colisiones)){const r={mesh:o,w,h,d,esCaja:true};colisiones.push(r);propios.push(r);}return o;}
  function esfera(nombre,x,y,z,sx,sy,sz,mat,padre=raiz){const o=marcar(new THREE.Mesh(geoEsfera,mat));o.name=nombre;o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function tex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;texturas.add(t);return t;}
  function plano(c,w,h,x,y,z,ry=0,padre=raiz){const g=new THREE.PlaneGeometry(w,h);geometrias.add(g);const m=new THREE.MeshBasicMaterial({map:tex(c),toneMapped:false});materiales.add(m);const o=marcar(new THREE.Mesh(g,m));o.position.set(x,y,z);o.rotation.y=ry;padre.add(o);return o;}
  function cilindroEntre(a,b,r,mat,padre){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),dir=vb.clone().sub(va);const g=new THREE.CylinderGeometry(r,r,dir.length(),12);geometrias.add(g);const o=marcar(new THREE.Mesh(g,mat));o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=o.receiveShadow=true;padre.add(o);return o;}
  // Solo se retiran la cama y la cabecera de este dormitorio.
  const zona=new THREE.Box3(new THREE.Vector3(7.35,9.99,-1.65),new THREE.Vector3(19.7,16.95,17.7));
  castillo.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(castillo.matrixWorld).invert(),bb=new THREE.Box3();
  castillo.traverse(o=>{if(!o.isMesh||!/^(Cama|Cabecera)(\s|$)/i.test(o.name))return;bb.setFromObject(o).applyMatrix4(inv);if(zona.containsBox(bb))ocultos.push({objeto:o,visible:o.visible});});ocultos.forEach(r=>r.objeto.visible=false);
  if(Array.isArray(colisiones)){const quitar=new Set(ocultos.map(r=>r.objeto));for(let i=colisiones.length-1;i>=0;i--)if(quitar.has(colisiones[i].mesh))retirados.push({indice:i,valor:colisiones.splice(i,1)[0]});}
  caja('Deseos · Pared este',19.585,13.5,8,.018,6.96,19.2,crema);
  caja('Deseos · Pared frontal',13.5,13.5,17.585,12.25,6.96,.018,crema);
  caja('Deseos · Pared posterior',13.5,13.5,-1.685,12.25,6.96,.018,crema);
  caja('Deseos · Pared oeste sur',7.335,13.5,2.6,.018,6.96,8.14,crema);
  caja('Deseos · Pared oeste norte',7.335,13.5,13.4,.018,6.96,8.14,crema);
  caja('Deseos · Dintel',7.335,15.3,8,.018,3.36,2.66,crema);
  const sueloMat=material('#ab8c64');caja('Deseos · Piso',13.5,10.05,8,12.22,.012,19.15,sueloMat);
  const tabla=canvas(512,512),tt=tabla.getContext('2d');tt.fillStyle='#ad916c';tt.fillRect(0,0,512,512);
  for(let i=0;i<8;i++){tt.fillStyle=i%2?'#b99b75':'#a78a65';tt.fillRect(0,i*64,512,64);tt.strokeStyle='#725a3d88';tt.strokeRect(0,i*64,512,64);for(let j=0;j<5;j++){tt.beginPath();tt.moveTo(0,i*64+10+j*9);tt.bezierCurveTo(170,i*64+j*9,340,i*64+18+j*9,512,i*64+10+j*9);tt.stroke();}}
  const mapaSuelo=tex(tabla);mapaSuelo.wrapS=mapaSuelo.wrapT=THREE.RepeatWrapping;mapaSuelo.repeat.set(3,5);sueloMat.map=mapaSuelo;sueloMat.color.set('#ffffff');
  for(const z of [-1.55,17.47]){caja('Deseos · Zócalo',13.5,10.3,z,12.1,.4,.14,madera);caja('Deseos · Cornisa',13.5,16.35,z,12.1,.12,.14,oro);}
  caja('Deseos · Cornisa este',19.47,16.35,8,.12,.12,19.0,oro);
  const techo=canvas(768,1024),tc=techo.getContext('2d');const grad=tc.createLinearGradient(0,0,768,1024);grad.addColorStop(0,'#8eaaa9');grad.addColorStop(.5,'#bec9ba');grad.addColorStop(1,'#e0c9ad');tc.fillStyle=grad;tc.fillRect(0,0,768,1024);
  let semilla=64299;const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  tc.fillStyle='#fff0bf';for(let i=0;i<125;i++){const x=azar()*768,y=azar()*1024,r=.8+azar()*2;tc.beginPath();tc.arc(x,y,r,0,Math.PI*2);tc.fill();if(i%15===0){tc.fillRect(x-7,y-.6,14,1.2);tc.fillRect(x-.6,y-7,1.2,14);}}
  tc.strokeStyle='#bf9f66';tc.lineWidth=3;tc.strokeRect(18,18,732,988);const cielo=plano(techo,12.15,19.15,13.5,16.55,8);cielo.rotation.x=Math.PI/2;
  const nubeMat=material('#f4ead8',{transparent:true,opacity:.62,depthWrite:false});
  for(const [x,z] of [[10.2,1.5],[16.9,14.8],[11.5,15]])for(let i=0;i<4;i++){const n=esfera('Deseos · Nube',x+(i-1.5)*.42,16.08+(i%2)*.08,z,.44,.18,.30,nubeMat);n.castShadow=false;}
  const alf=canvas(512,512),ac=alf.getContext('2d');ac.fillStyle='#597580';ac.fillRect(0,0,512,512);for(const d of [12,24,42]){ac.strokeStyle=d===24?'#e6c997':'#a4b0aa';ac.lineWidth=3;ac.strokeRect(d,d,512-2*d,512-2*d);}ac.strokeStyle='#ddc59d';ac.beginPath();ac.arc(256,256,135,0,Math.PI*2);ac.stroke();
  const alfombra=plano(alf,8.2,10,14.0,10.071,9);alfombra.rotation.x=-Math.PI/2;
  // Diorama de una casa y una familia simbólica. No reproduce personas reales.
  const hogar=new THREE.Group();hogar.name='Deseos · Hogar en miniatura';hogar.position.set(14.5,10.58,9);hogar.rotation.y=-Math.PI/2;raiz.add(hogar);
  const cesped=material('#78906c'),paredCasa=material('#e9d9b6'),tejas=material('#9e6d61'),bordeCasa=material('#f1e6ce'),tronco=material('#71533b'),hojas=material('#6c8d68');
  caja('Deseos · Base del jardín',0,0,0,6.8,.24,5.2,cesped,hogar,true);
  caja('Deseos · Zócalo de maqueta',0,-.17,0,6.95,.13,5.35,madera,hogar);
  caja('Deseos · Casa',0,1.12,-.22,3.1,2.0,2.3,paredCasa,hogar);
  const techoGeo=new THREE.BufferGeometry();
  const A=[-1.8,2.1,1.13],B=[1.8,2.1,1.13],C=[0,3.2,1.13],D=[-1.8,2.1,-1.57],E=[1.8,2.1,-1.57],F=[0,3.2,-1.57];
  const vertices=[];for(const t of [[A,B,C],[D,F,E],[A,C,F],[A,F,D],[B,E,F],[B,F,C],[A,D,E],[A,E,B]])vertices.push(...t[0],...t[1],...t[2]);
  techoGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));techoGeo.computeVertexNormals();geometrias.add(techoGeo);const tejado=marcar(new THREE.Mesh(techoGeo,tejas));tejado.name='Deseos · Tejado de la casa';tejado.castShadow=tejado.receiveShadow=true;hogar.add(tejado);
  caja('Deseos · Chimenea',-.92,2.9,-.8,.37,.8,.42,madera,hogar);
  caja('Deseos · Puerta del hogar',0,.73,.946,.60,1.2,.07,madera,hogar);esfera('Deseos · Pomo',.20,.73,.993,.035,.035,.02,oro,hogar);
  const ventanaMat=material('#ffe4aa',{emissive:'#ffd08a',emissiveIntensity:.30,roughness:.4});
  for(const x of [-.91,.91]){
    caja('Deseos · Marco de ventana',x,1.28,.96,.66,.73,.09,bordeCasa,hogar);
    caja('Deseos · Ventana iluminada',x,1.28,1.015,.51,.57,.025,ventanaMat,hogar);
    caja('Deseos · Cruz de ventana',x,1.28,1.037,.035,.59,.025,madera,hogar);caja('Deseos · Cruz de ventana',x,1.28,1.039,.53,.035,.025,madera,hogar);
    for(const dx of [-.46,.46])caja('Deseos · Contraventana',x+dx,1.28,.98,.18,.72,.07,azul,hogar);
  }
  esfera('Deseos · Ventana redonda',0,2.5,1.145,.24,.24,.035,ventanaMat,hogar);
  caja('Deseos · Escalón',0,.18,1.18,1.02,.13,.48,bordeCasa,hogar);
  for(let i=0;i<4;i++)caja('Deseos · Sendero',0,.14,1.55+i*.23,.60,.035,.16,crema,hogar);
  for(const x of [-2.75,2.75]){
    for(let i=0;i<6;i++)caja('Deseos · Estaca del jardín',x,.37,-1.98+i*.71,.07,.5,.07,bordeCasa,hogar);
    caja('Deseos · Valla del jardín',x,.39,-.2,.06,.05,3.9,bordeCasa,hogar);
  }
  const floresMats=['#c18d91','#edd1a2','#a2b3c1'].map(c=>material(c));
  for(let i=0;i<22;i++){const lado=i%2?1:-1,x=lado*(1.9+azar()*.58),z=-1.8+azar()*3.7;cilindroEntre([x,.13,z],[x,.35,z],.012,hojas,hogar);esfera('Deseos · Flor',x,.39,z,.07,.045,.07,floresMats[i%3],hogar);}
  cilindroEntre([-2.17,.13,-1.10],[-2.17,1.45,-1.10],.11,tronco,hogar);
  for(const [x,y,z,s] of [[-2.17,1.8,-1.1,.65],[-2.5,1.6,-1.1,.45],[-1.87,1.65,-1.2,.45]])esfera('Deseos · Copa del árbol',x,y,z,s,s*.9,s,hojas,hogar);
  const personas=[],tinta=material('#3f3433'),brillo=material('#fff3da');
  // FAMILIA_DESEOS_DETALLADA_V2
  function persona(conf,x,z){
    const g=new THREE.Group();g.name='Familia · Figura detallada';g.position.set(x,.12,z);g.scale.setScalar(conf.altura);hogar.add(g);
    const infantil=conf.altura<.9,alternar=personas.length%2===1;
    const piel=material(conf.piel,{roughness:.88}),sombraPiel=material(new THREE.Color(conf.piel).multiplyScalar(.90),{roughness:.9});
    const ropa=material(conf.ropa,{roughness:.96}),pelo=material(conf.pelo,{roughness:.94});
    const mechonMat=material(new THREE.Color(conf.pelo).multiplyScalar(1.18),{roughness:.95});
    const pantalon=material(infantil?'#727f83':'#4c5862',{roughness:.97}),zapato=material('#58453a',{roughness:.65}),suela=material('#3b3633',{roughness:1});
    const labios=material(new THREE.Color(conf.piel).multiply(new THREE.Color('#b88985')),{roughness:.85});
    const iris=material('#604a37',{roughness:.4}),pupila=material('#212527',{roughness:.28}),esclerotica=material('#e9e5d9',{roughness:.4});
    const uña=material(new THREE.Color(conf.piel).lerp(new THREE.Color('#f0d8c7'),.3),{roughness:.65});
    const tejido=canvas(128,128),ct=tejido.getContext('2d');ct.fillStyle='#fafafa';ct.fillRect(0,0,128,128);ct.strokeStyle='#77777716';ct.lineWidth=.6;
    for(let i=0;i<128;i+=4){ct.beginPath();ct.moveTo(i,0);ct.lineTo(i,128);ct.stroke();ct.beginPath();ct.moveTo(0,i);ct.lineTo(128,i);ct.stroke();}
    ropa.map=tex(tejido);ropa.map.wrapS=ropa.map.wrapT=THREE.RepeatWrapping;ropa.map.repeat.set(2,3);ropa.needsUpdate=true;
    // Silueta humana: cadera, muslos, rodillas, pantorrillas y calzado separados.
    esfera('Familia · Torso',0,.615,0,.132,.183,.077,ropa,g);
    esfera('Familia · Cadera',0,.445,-.005,.112,.074,.073,pantalon,g);
    for(const xx of [-.066,.066]){
      cilindroEntre([xx,.438,0],[xx,.247,.014],.050,pantalon,g);
      esfera('Familia · Rodilla',xx,.242,.014,.044,.047,.044,pantalon,g);
      cilindroEntre([xx,.230,.014],[xx,.072,.011],.035,pantalon,g);
      esfera('Familia · Zapato',xx,.039,.042,.046,.034,.084,zapato,g);
      caja('Familia · Suela',xx,.014,.04,.091,.014,.155,suela,g);
      caja('Familia · Dobladillo',xx,.079,.012,.073,.022,.070,pantalon,g);
    }
    cilindroEntre([0,.748,0],[0,.809,.004],.031,piel,g);
    caja('Familia · Cuello izquierdo',-.035,.748,.063,.061,.037,.015,ropa,g).rotation.z=-.40;
    caja('Familia · Cuello derecho',.035,.748,.063,.061,.037,.015,ropa,g).rotation.z=.40;
    for(const yy of [.697,.641,.585])esfera('Familia · Botón',0,yy,.078,.008,.008,.004,crema,g);
    const cabeza=new THREE.Group();cabeza.position.set(0,.884,.006);g.add(cabeza);
    const fx=infantil?1.10:1,fy=infantil?1.05:1;cabeza.scale.set(fx,fy,fx);
    esfera('Familia · Rostro',0,0,0,.076,.101,.077,piel,cabeza);
    esfera('Familia · Mandíbula',0,-.062,.007,.056,.043,.057,piel,cabeza);
    for(const lado of [-1,1]){
      esfera('Familia · Oreja',lado*.077,-.006,-.003,.014,.024,.012,piel,cabeza);
      esfera('Familia · Interior de oreja',lado*.081,-.005,.006,.006,.014,.004,sombraPiel,cabeza);
      esfera('Familia · Mejilla',lado*.040,-.025,.051,.028,.027,.022,piel,cabeza);
    }
    esfera('Familia · Puente de nariz',0,-.002,.073,.010,.023,.012,piel,cabeza);
    esfera('Familia · Punta de nariz',0,-.019,.087,.013,.010,.014,piel,cabeza);
    const ojos=[];
    for(const lado of [-1,1]){
      const ojo=new THREE.Group();ojo.position.set(lado*.030,.018,.066);cabeza.add(ojo);ojos.push(ojo);
      esfera('Familia · Blanco del ojo',0,0,0,.018,.010,.010,esclerotica,ojo);
      esfera('Familia · Iris',0,0,.009,.007,.0075,.003,iris,ojo);
      esfera('Familia · Pupila',0,0,.0115,.0035,.0045,.002,pupila,ojo);
      esfera('Familia · Reflejo del ojo',-.002,.0028,.013,.0018,.0018,.0013,brillo,ojo);
      cilindroEntre([lado*.030-.016,.043,.061],[lado*.030+.016,.046,.061],.0034,pelo,cabeza);
      esfera('Familia · Párpado',lado*.030,.030,.067,.019,.003,.006,piel,cabeza);
    }
    const sonrisa=new THREE.Group();sonrisa.position.set(0,-.049,.066);cabeza.add(sonrisa);
    esfera('Familia · Labio superior',0,0,0,.021,.0037,.004,labios,sonrisa);
    esfera('Familia · Labio inferior',0,-.004,.001,.019,.0036,.0045,labios,sonrisa);
    for(const lado of [-1,1])esfera('Familia · Comisura',lado*.020,.002,0,.003,.003,.003,labios,sonrisa);
    // Cabello en capas y mechones, sin usar fotografías ni modelos externos.
    esfera('Familia · Cabello posterior',0,.038,-.028,.080,.073,.066,pelo,cabeza);
    esfera('Familia · Coronilla',0,.075,-.006,.079,.038,.071,pelo,cabeza);
    if(alternar){
      for(const lado of [-1,1])esfera('Familia · Mechón lateral',lado*.070,-.019,-.027,.021,.100,.044,pelo,cabeza);
      esfera('Familia · Melena posterior',0,-.025,-.057,.079,.115,.034,pelo,cabeza);
    }
    for(let i=0;i<18;i++){
      const a=i*Math.PI*2/18,px=Math.cos(a)*.061,pz=-.018+Math.sin(a)*.051;
      const m=esfera('Familia · Hebra de cabello',px,.082+Math.sin(a)*.008,pz,.008,.024,.012,i%3?mechonMat:pelo,cabeza);m.rotation.z=-Math.cos(a)*.45;
    }
    for(let i=0;i<5;i++){const xx=-.052+i*.024;const m=esfera('Familia · Flequillo',xx,.063-Math.abs(xx)*.10,.055,.014,.022,.014,pelo,cabeza);m.rotation.z=-.35;}
    const brazos=[];
    for(const lado of [-1,1]){
      const b=new THREE.Group();b.position.set(lado*.127,.722,0);b.rotation.z=lado*.14;g.add(b);
      esfera('Familia · Hombro',0,-.025,0,.046,.060,.049,ropa,b);
      cilindroEntre([0,-.025,0],[lado*.024,-.153,.012],.035,ropa,b);
      esfera('Familia · Codo',lado*.024,-.153,.012,.028,.031,.028,piel,b);
      cilindroEntre([lado*.024,-.159,.012],[lado*.038,-.275,.037],.023,piel,b);
      const mano=new THREE.Group();mano.position.set(lado*.038,-.285,.037);b.add(mano);
      esfera('Familia · Palma',0,-.012,0,.024,.033,.012,piel,mano);
      const largos=[.042,.052,.049,.037];
      for(let d=0;d<4;d++){
        const xx=-.017+d*.0115,yy=-.034-largos[d]/2;
        esfera('Familia · Dedo',xx,yy,.001,.0052,largos[d]/2,.0055,piel,mano);
        esfera('Familia · Uña',xx,yy-largos[d]*.27,.006,.0034,.006,.0016,uña,mano);
      }
      const pulgar=esfera('Familia · Pulgar',lado*.026,-.025,.004,.0075,.024,.0075,piel,mano);pulgar.rotation.z=lado*.65;
      brazos.push({grupo:b,lado});
    }
    // Instanciar pequeños detalles por material y articulación conserva los gestos.
    function agruparDetalles(padre){
      for(const hijo of [...padre.children])if(hijo.isGroup)agruparDetalles(hijo);
      const lotes=new Map();for(const o of padre.children){if(!o.isMesh||o.isInstancedMesh||o.geometry!==geoEsfera)continue;if(!lotes.has(o.material))lotes.set(o.material,[]);lotes.get(o.material).push(o);}
      for(const [mat,objetos] of lotes){if(objetos.length<3)continue;const lote=marcar(new THREE.InstancedMesh(geoEsfera,mat,objetos.length));lote.name='Familia · Detalles agrupados';objetos.forEach((o,i)=>{o.updateMatrix();lote.setMatrixAt(i,o.matrix);o.removeFromParent();});lote.instanceMatrix.needsUpdate=true;lote.computeBoundingSphere();lote.castShadow=lote.receiveShadow=true;padre.add(lote);}
    }
    agruparDetalles(g);personas.push({grupo:g,brazos,sonrisa,cabeza,ojos});
  }
  const configuracion=Array.isArray(opciones.personas)&&opciones.personas.length===4?opciones.personas:FAMILIA_SALA_DESEOS;
  persona(configuracion[0],-.73,1.85);persona(configuracion[1],.73,1.85);persona(configuracion[2],-.24,2.28);persona(configuracion[3],.29,2.31);
  const lamparaMat=material('#ffe5b5',{emissive:'#ffc97e',emissiveIntensity:.30});
  for(const x of [-2.28,2.28]){caja('Deseos · Farol del jardín',x,.62,1.65,.055,.98,.055,madera,hogar);esfera('Deseos · Luz del farol',x,1.15,1.65,.12,.16,.12,lamparaMat,hogar);}
  // Mesa para escribir y sobre 3D sin texto. El contenido del deseo nunca se dibuja.
  caja('Deseos · Mesa de los deseos',10.1,10.65,4.1,2.2,1.1,1.25,madera,raiz,true);
  caja('Deseos · Tapa de mesa',10.1,11.25,4.1,2.4,.13,1.45,oro);
  const placa=canvas(768,220),pc=placa.getContext('2d');pc.fillStyle='#435f67';pc.fillRect(0,0,768,220);pc.strokeStyle='#c7ac77';pc.lineWidth=4;pc.strokeRect(12,12,744,196);pc.fillStyle='#f5e5be';pc.font='38px Georgia';pc.textAlign='center';pc.fillText('SALA DE LOS DESEOS',384,95);pc.font='23px Georgia';pc.fillText('Un hogar para imaginar',384,151);plano(placa,5.8,1.5,13.5,15.2,-1.56);
  const letrero=canvas(512,160),lc=letrero.getContext('2d');lc.fillStyle='#405e66';lc.fillRect(0,0,512,160);lc.fillStyle='#eeddb7';lc.font='27px Georgia';lc.textAlign='center';lc.fillText('UN DESEO PARA EL CAMINO',256,70);lc.font='20px Georgia';lc.fillText('Acércate y pulsa R',256,117);plano(letrero,1.8,.57,10.1,11.56,4.78);
  const sobre=new THREE.Group();sobre.name='Deseos · Sobre en blanco';raiz.add(sobre);
  const papelMat=new THREE.MeshBasicMaterial({color:'#fff0cd',transparent:true,opacity:1,toneMapped:false});materiales.add(papelMat);
  caja('Deseos · Papel sin inscripción',0,0,0,.60,.39,.025,papelMat,sobre);
  const flapGeo=new THREE.BufferGeometry();flapGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.28,.17,.018,.28,.17,.018,0,-.02,.018],3));flapGeo.computeVertexNormals();geometrias.add(flapGeo);
  const flapMat=new THREE.MeshBasicMaterial({color:'#d3b47c',side:THREE.DoubleSide,transparent:true,opacity:1,toneMapped:false});materiales.add(flapMat);sobre.add(marcar(new THREE.Mesh(flapGeo,flapMat)));
  const selloMat=new THREE.MeshBasicMaterial({color:'#aa7367',transparent:true,opacity:1,toneMapped:false});materiales.add(selloMat);esfera('Deseos · Sello',0,-.025,.035,.05,.05,.012,selloMat,sobre);
  const inicioSobre=new THREE.Vector3(10.1,11.6,4.3),finSobre=new THREE.Vector3(14.5,15.25,9);sobre.position.copy(inicioSobre);sobre.rotation.y=-.15;
  const brilloCanvas=canvas(64,64),bc=brilloCanvas.getContext('2d'),bg=bc.createRadialGradient(32,32,0,32,32,31);bg.addColorStop(0,'rgba(255,255,255,1)');bg.addColorStop(.18,'rgba(255,241,204,1)');bg.addColorStop(.45,'rgba(255,206,118,.3)');bg.addColorStop(1,'rgba(255,255,255,0)');bc.fillStyle=bg;bc.fillRect(0,0,64,64);const brilloTex=tex(brilloCanvas);
  const estrellaMat=new THREE.SpriteMaterial({map:brilloTex,color:'#ffe1a1',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(estrellaMat);
  const estrella=new THREE.Sprite(estrellaMat);estrella.position.copy(finSobre);estrella.scale.set(1.0,1.0,1);raiz.add(estrella);
  const semillas=[];for(let i=0;i<260;i++)semillas.push({a:azar()*Math.PI*2,r:.25+azar()*2.7,v:.7+azar()*.8,f:azar()});
  const particulasGeo=new THREE.BufferGeometry();particulasGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(semillas.length*3),3));geometrias.add(particulasGeo);
  const particulasMat=new THREE.PointsMaterial({map:brilloTex,color:'#ffe6aa',size:.11,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(particulasMat);
  const particulas=new THREE.Points(particulasGeo,particulasMat);particulas.frustumCulled=false;raiz.add(particulas);
  const corazon=new THREE.Group();corazon.position.set(14.5,14.85,9);corazon.rotation.y=-Math.PI/2;raiz.add(corazon);
  const hpts=[];for(let i=0;i<100;i++){const t=i*Math.PI*2/100;hpts.push(new THREE.Vector3(Math.pow(Math.sin(t),3),(.8125*Math.cos(t)-.3125*Math.cos(2*t)-.125*Math.cos(3*t)-.0625*Math.cos(4*t))*.95,0));}
  const heartGeo=new THREE.BufferGeometry().setFromPoints(hpts);geometrias.add(heartGeo);
  const heartMat=new THREE.LineBasicMaterial({color:'#ffe0a2',transparent:true,opacity:0,toneMapped:false});materiales.add(heartMat);corazon.add(new THREE.LineLoop(heartGeo,heartMat));
  const heartPointsMat=new THREE.PointsMaterial({map:brilloTex,color:'#ffdf9d',size:.09,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(heartPointsMat);corazon.add(new THREE.Points(heartGeo,heartPointsMat));
  const luz=new THREE.PointLight(0xffd5a1,25,13,2);luz.position.set(14.2,15.1,9);luz.castShadow=false;raiz.add(luz);marcar(luz);
  // Acabados de casa, jardín e iluminación, sin añadir dependencias externas.
  const yeso=canvas(256,256),yc=yeso.getContext('2d');yc.fillStyle='#fffaf0';yc.fillRect(0,0,256,256);
  for(let i=0;i<3500;i++){yc.fillStyle=i%2?'#baa9890c':'#ffffff40';yc.fillRect(azar()*256,azar()*256,1+azar(),1+azar());}
  paredCasa.map=tex(yeso);paredCasa.map.wrapS=paredCasa.map.wrapT=THREE.RepeatWrapping;paredCasa.map.repeat.set(2,2);paredCasa.roughness=.96;paredCasa.bumpMap=paredCasa.map;paredCasa.bumpScale=.015;paredCasa.needsUpdate=true;
  const tejaCanvas=canvas(512,512),rt=tejaCanvas.getContext('2d');rt.fillStyle='#b98573';rt.fillRect(0,0,512,512);
  for(let fila=0;fila<8;fila++)for(let col=-1;col<9;col++){
    const xx=col*64+(fila%2)*32,yy=fila*64;rt.fillStyle=(fila+col)%3?'#b78371':'#c3917e';rt.fillRect(xx+2,yy+2,60,60);rt.strokeStyle='#77504388';rt.lineWidth=2;rt.strokeRect(xx+1,yy+1,62,63);rt.strokeStyle='#f0c3a755';rt.beginPath();rt.moveTo(xx+7,yy+7);rt.lineTo(xx+56,yy+7);rt.stroke();
  }
  tejas.map=tex(tejaCanvas);tejas.color.set('#ffffff');tejas.roughness=.95;tejas.bumpMap=tejas.map;tejas.bumpScale=.023;tejas.needsUpdate=true;
  const posTecho=techoGeo.attributes.position,uvTecho=[];
  for(let i=0;i<posTecho.count;i++)uvTecho.push((posTecho.getZ(i)+1.57)/2.70,1-Math.abs(posTecho.getX(i))/1.8);
  techoGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvTecho,2));techoGeo.clearGroups();techoGeo.addGroup(0,6,0);techoGeo.addGroup(6,posTecho.count-6,1);tejado.material=[paredCasa,tejas];
  // Bordes de tejado y pequeño porche de madera.
  cilindroEntre([-1.83,2.09,1.15],[0,3.24,1.15],.033,bordeCasa,hogar);cilindroEntre([0,3.24,1.15],[1.83,2.09,1.15],.033,bordeCasa,hogar);
  cilindroEntre([0,3.24,-1.60],[0,3.24,1.18],.035,tejas,hogar);
  for(let i=0;i<7;i++)caja('Deseos · Tabla de porche',0,.18,1.12+i*.085,2.32,.035,.077,madera,hogar);
  const cortinaMat=material('#eee1c9',{roughness:1});
  for(const xx of [-.91,.91]){
    caja('Deseos · Jardinera de ventana',xx,.84,1.09,.77,.14,.23,madera,hogar);
    for(const dx of [-.18,.18])caja('Deseos · Cortina',xx+dx,1.28,1.055,.055,.49,.012,cortinaMat,hogar);
    for(let i=0;i<5;i++)esfera('Deseos · Flores de ventana',xx-.28+i*.14,.955,1.16,.05,.04,.05,floresMats[i%3],hogar);
  }
  // Unos pocos lotes de instancias añaden pétalos y hierba sin cientos de mallas.
  const floresOriginales=hogar.children.filter(o=>o.name==='Deseos · Flor'),lotesPetalos=new Map();
  for(const flor of floresOriginales){if(!lotesPetalos.has(flor.material))lotesPetalos.set(flor.material,[]);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const dummy=new THREE.Object3D();dummy.position.set(flor.position.x+Math.cos(a)*.066,flor.position.y,flor.position.z+Math.sin(a)*.066);dummy.scale.set(.049,.018,.032);dummy.rotation.y=-a;dummy.updateMatrix();lotesPetalos.get(flor.material).push(dummy.matrix.clone());}}
  for(const [mat,matrices] of lotesPetalos){const lote=marcar(new THREE.InstancedMesh(geoEsfera,mat,matrices.length));lote.name='Deseos · Pétalos agrupados';matrices.forEach((m,i)=>lote.setMatrixAt(i,m));lote.instanceMatrix.needsUpdate=true;lote.computeBoundingSphere();hogar.add(lote);}
  const hierbaGeo=new THREE.PlaneGeometry(.025,.15);geometrias.add(hierbaGeo);const hierbaMat=material('#6c8558',{side:THREE.DoubleSide});
  const hierba=marcar(new THREE.InstancedMesh(hierbaGeo,hierbaMat,100));hierba.name='Deseos · Hierba del jardín';
  for(let i=0;i<100;i++){const d=new THREE.Object3D();d.position.set((i%2?1:-1)*(1.92+azar()*.70),.20,-1.9+azar()*3.9);d.rotation.y=azar()*Math.PI;d.rotation.z=(azar()-.5)*.35;d.scale.y=.6+azar()*.65;d.updateMatrix();hierba.setMatrixAt(i,d.matrix);}
  hierba.instanceMatrix.needsUpdate=true;hierba.computeBoundingSphere();hogar.add(hierba);
  const halosVentana=[];
  for(const [xx,yy,zz,tam] of [[-.91,1.28,1.09,.77],[.91,1.28,1.09,.77],[0,2.5,1.20,.61]]){
    const m=new THREE.SpriteMaterial({map:brilloTex,color:'#ffd799',transparent:true,opacity:.04,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materiales.add(m);halosVentana.push(m);const s=new THREE.Sprite(m);s.position.set(xx,yy,zz);s.scale.set(tam,tam,1);hogar.add(s);
  }
  const rellenoFamilia=new THREE.SpotLight(0xffe4c3,35,12,Math.PI/4,.75,2);rellenoFamilia.name='Deseos · Luz suave de la familia';rellenoFamilia.position.set(9.8,14.7,9);rellenoFamilia.castShadow=false;rellenoFamilia.target.position.set(14.3,11.7,9);raiz.add(rellenoFamilia,rellenoFamilia.target);
  const coloresParticulas=[];const paletaChispas=['#ffe7b0','#f3caad','#fff5dc'].map(c=>new THREE.Color(c));
  for(let i=0;i<semillas.length;i++){const c=paletaChispas[i%3];coloresParticulas.push(c.r,c.g,c.b);}
  particulasGeo.setAttribute('color',new THREE.Float32BufferAttribute(coloresParticulas,3));particulasMat.color.set('#ffffff');particulasMat.vertexColors=true;particulasMat.needsUpdate=true;

  // Interfaz efímera: sin almacenamiento, historial, solicitudes, analítica ni registro del texto.
  const id='sala-deseos-hogar',estilo=document.createElement('style');estilo.textContent=`
  #${id}[hidden],#${id} [hidden],#${id}-abrir[hidden]{display:none!important}
  #${id},#${id}-abrir{font:14px/1.6 system-ui,sans-serif;color:#f5ead2;box-sizing:border-box}
  #${id}{position:fixed;inset:0;z-index:33000;display:grid;place-items:center;padding:16px;background:#172026e8}
  #${id}.dh-animacion{display:flex;align-items:flex-end;justify-content:center;background:transparent}
  #${id} *{box-sizing:border-box}
  #${id} .dh-caja{position:relative;width:min(680px,100%);max-height:calc(100dvh - 32px);overflow:auto;padding:26px;background:linear-gradient(135deg,#3b5960,#253d46);border:1px solid #d2b783;border-radius:20px;box-shadow:0 20px 75px #0006}
  #${id}.dh-animacion .dh-caja{padding:18px 23px;background:#28444ced}
  #${id} h2{font:clamp(25px,4vw,34px) Georgia,serif;color:#ffebc5;margin:0 70px 12px 0}
  #${id} p{margin:10px 0}
  #${id} textarea{display:block;width:100%;min-height:155px;resize:vertical;max-height:35dvh;padding:15px;border:1px solid #c3b284;border-radius:12px;background:#f7eedb;color:#3b4240;font:17px/1.7 Georgia,serif;margin-top:9px}
  #${id} label{display:block;color:#efe0bf}
  #${id} .dh-contador{text-align:right;font-size:12px;color:#d3d2c0}
  #${id} button,#${id}-abrir{min-height:44px;padding:11px 17px;border:1px solid #d1b477;border-radius:10px;background:#526b6b;color:#fff0d2;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
  #${id} button:hover,#${id}-abrir:hover{background:#6c827a}
  #${id} :focus-visible,#${id}-abrir:focus-visible{outline:3px solid #ffe0a0;outline-offset:3px}
  #${id} button:disabled{opacity:.5;cursor:wait}
  #${id} .dh-cerrar{position:absolute;right:12px;top:12px}
  #${id} .dh-fila{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 0}
  #${id} .dh-privacidad{font-size:12px;line-height:1.65;color:#cbd0c7;border-top:1px solid #ffffff22;padding-top:12px;margin-top:15px}
  #${id} .dh-estado{color:#ffe0a6;min-height:1.6em;white-space:pre-line}
  #${id}-abrir{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:28;max-width:90vw;background:#2c5056ed;box-shadow:0 5px 25px #0006}
  #${id}.dh-animacion .dh-caja{max-height:45dvh}
  #${id}.dh-animacion .dh-estado{font:18px/1.65 Georgia,serif;color:#fff0cc}
  #${id}.dh-animacion .dh-privacidad{font-size:11px;line-height:1.45;margin-top:8px}
  @media(max-width:600px){#${id}{padding:7px}#${id} .dh-caja{padding:22px 15px;max-height:calc(100dvh - 14px)}#${id} textarea{font-size:16px;min-height:135px}#${id}.dh-animacion .dh-caja{padding:14px}#${id}.dh-animacion h2{font-size:22px}}
  `;document.head.appendChild(estilo);
  const panel=document.createElement('section');panel.id=id;panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby',id+'-titulo');
  panel.innerHTML=`<div class="dh-caja"><button type="button" class="dh-cerrar">Cerrar</button><h2 id="${id}-titulo">Un hogar para tus deseos</h2><div class="dh-escribir"><p>Hay deseos que no necesitan quedarse escritos. Compártelo con este instante y déjalo partir.</p><form class="dh-form" autocomplete="off" method="dialog"><label for="${id}-texto">Tu deseo<textarea id="${id}-texto" maxlength="500" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" placeholder="Escribe aquí tu deseo…"></textarea></label><p class="dh-contador" aria-live="off">0 / 500</p><div class="dh-fila"><button type="button" class="dh-enviar">Enviar mi deseo</button></div></form></div><p class="dh-estado" role="status" aria-live="polite"></p><div class="dh-fila"><button type="button" class="dh-otro" hidden>Escribir otro deseo</button></div><p class="dh-privacidad">Enviar solo activa una animación local. Este módulo no guarda ni transmite el texto. El campo se vacía al enviar, al cerrar o al ocultar esta página. No hay historial. Ctrl + Enter: enviar · Esc: cerrar.</p></div>`;document.body.appendChild(panel);
  const abrirBtn=document.createElement('button');abrirBtn.id=id+'-abrir';abrirBtn.type='button';abrirBtn.hidden=true;abrirBtn.textContent='R · Pedir un deseo';document.body.appendChild(abrirBtn);
  const titulo=panel.querySelector('h2'),formulario=panel.querySelector('form'),campo=panel.querySelector('textarea'),contador=panel.querySelector('.dh-contador'),estado=panel.querySelector('.dh-estado');
  const cerrarBtn=panel.querySelector('.dh-cerrar'),enviarBtn=panel.querySelector('.dh-enviar'),otroBtn=panel.querySelector('.dh-otro'),menu=document.getElementById('menu');
  let controles=null,oclusion=null,abierto=false,liberado=false,dentro=false,cerca=false,fase='cerrado',tiempo=0,reloj=0;
  let recuerdoCamara=null,destinoCamara=null;
  const reducido=window.matchMedia('(prefers-reduced-motion: reduce)').matches,localCam=new THREE.Vector3();
  function limpiarCampo(){campo.value='';campo.defaultValue='';formulario.reset();contador.textContent='0 / 500';}
  limpiarCampo();
  function interfaz(){
    const animando=fase==='animando',finalizado=fase==='finalizado';
    panel.classList.toggle('dh-animacion',animando||finalizado);panel.querySelector('.dh-escribir').hidden=animando||finalizado;
    enviarBtn.disabled=animando||finalizado;campo.disabled=animando||finalizado;otroBtn.hidden=!finalizado;
    titulo.textContent=animando?'Deja que tu deseo vuele…':finalizado?'Que la vida te sorprenda':'Un hogar para tus deseos';
    estado.textContent=animando?"Que este deseo encuentre su camino y la vida te sorprenda con algo bonito.\nMientras tanto, que no te falten amor, calma y compañía.":finalizado?"Que nunca te falte un hogar donde sentir paz, una mano que te acompañe y pequeños motivos para sonreír.\n\nOjalá la vida te acerque, paso a paso, a eso que hoy deseas.":'';
  }
  function enfocar(){
    castillo.updateWorldMatrix(true,false);const posicion=castillo.localToWorld(new THREE.Vector3(9.0,12.5,9.0)),objetivo=castillo.localToWorld(new THREE.Vector3(14.5,12.5,9.0));
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(posicion,objetivo,camara.up));
    if(camara.parent){camara.parent.updateWorldMatrix(true,false);camara.parent.worldToLocal(posicion);q.premultiply(camara.parent.getWorldQuaternion(new THREE.Quaternion()).invert());}
    return{posicion,quaternion:q};
  }
  function restaurarCamara(){if(recuerdoCamara){camara.position.copy(recuerdoCamara.posicion);camara.quaternion.copy(recuerdoCamara.quaternion);recuerdoCamara=null;destinoCamara=null;}}
  function resetVisual(){tiempo=0;sobre.position.copy(inicioSobre);sobre.rotation.set(0,-.15,0);sobre.scale.setScalar(1);papelMat.opacity=flapMat.opacity=selloMat.opacity=1;estrellaMat.opacity=0;particulasMat.opacity=0;heartMat.opacity=heartPointsMat.opacity=0;ventanaMat.emissiveIntensity=.30;lamparaMat.emissiveIntensity=.30;}
  function abrir(){
    if(liberado||!dentro||!cerca||abierto)return;
    limpiarCampo();resetVisual();fase='escribiendo';abierto=true;controles?.pausar?.();if(document.pointerLockElement){try{const p=document.exitPointerLock();p?.catch?.(()=>{});}catch{}}
    panel.hidden=false;abrirBtn.hidden=true;if(menu)menu.hidden=true;interfaz();campo.focus({preventScroll:true});
  }
  function enviar(){
    if(liberado||!abierto||fase!=='escribiendo')return;
    // Solo validación. No se crea ninguna copia del contenido ni se pasa a otra función.
    if(!/\S/u.test(campo.value)){estado.textContent='Escribe un deseo antes de enviarlo.';campo.focus();return;}
    if(campo.value.length>500){estado.textContent='El deseo puede tener hasta 500 caracteres.';return;}
    limpiarCampo();campo.blur();fase='animando';tiempo=0;
    recuerdoCamara={posicion:camara.position.clone(),quaternion:camara.quaternion.clone()};destinoCamara=enfocar();interfaz();cerrarBtn.focus();
  }
  function cerrar(){
    limpiarCampo();if(!abierto)return;
    restaurarCamara();resetVisual();fase='cerrado';abierto=false;panel.hidden=true;
    if(menu){menu.hidden=false;document.getElementById('boton-iniciar')?.focus();}
  }
  function otro(){if(liberado||fase!=='finalizado')return;limpiarCampo();restaurarCamara();resetVisual();fase='escribiendo';interfaz();campo.focus();}
  function alOcultar(){if(document.hidden)cerrar();}
  function alSalir(){cerrar();}
  function alMostrar(){limpiarCampo();}
  function alDesbloquear(){if(abierto&&menu)menu.hidden=true;}
  campo.addEventListener('input',()=>{contador.textContent=String(campo.value.length)+' / 500';if(fase==='escribiendo')estado.textContent='';});
  formulario.addEventListener('submit',e=>{e.preventDefault();enviar();});enviarBtn.addEventListener('click',enviar);otroBtn.addEventListener('click',otro);cerrarBtn.addEventListener('click',cerrar);abrirBtn.addEventListener('click',abrir);
  function teclado(e){
    if(abierto){
      if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();return;}
      if(e.code==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();e.stopImmediatePropagation();enviar();return;}
      if(e.code==='Tab'){
        const lista=[...panel.querySelectorAll('button,textarea')].filter(b=>!b.disabled&&b.getClientRects().length),primero=lista[0],ultimo=lista[lista.length-1];
        if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}
      }
      if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','KeyG','Space'].includes(e.code))e.stopImmediatePropagation();return;
    }
    if(e.code==='KeyR'&&!e.repeat&&dentro&&cerca&&!Boolean(menu&&!menu.hidden)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();e.stopImmediatePropagation();abrir();}
  }
  document.addEventListener('keydown',teclado,true);document.addEventListener('pointerlockchange',alDesbloquear);document.addEventListener('visibilitychange',alOcultar);window.addEventListener('pagehide',alSalir);window.addEventListener('pageshow',alMostrar);
  function actualizarAnimacion(t){
    const duracion=reducido?2.8:9.5,p=Math.min(1,t/duracion),q=p*p*(3-2*p);
    if(recuerdoCamara&&destinoCamara){const c=Math.min(1,t/(reducido ? .05:1.4)),s=c*c*(3-2*c);camara.position.lerpVectors(recuerdoCamara.posicion,destinoCamara.posicion,s);camara.quaternion.slerpQuaternions(recuerdoCamara.quaternion,destinoCamara.quaternion,s);}
    const vuelo=Math.min(1,p/.37);sobre.position.lerpVectors(inicioSobre,finSobre,vuelo);sobre.position.y+=Math.sin(vuelo*Math.PI)*1.2;sobre.rotation.y=-.15+(reducido?0:vuelo*Math.PI*2);sobre.rotation.z=Math.sin(vuelo*Math.PI)*.18;
    const op=Math.max(0,1-Math.max(0,p-.25)/.15);papelMat.opacity=flapMat.opacity=selloMat.opacity=op;
    estrellaMat.opacity=Math.max(0,Math.min(1,(p-.26)/.12))*(p>.88?1-(p-.88)/.12:1);estrella.scale.setScalar(.8+Math.sin(p*Math.PI)*.9);
    const fuerza=Math.sin(Math.PI*Math.min(1,p*1.25));ventanaMat.emissiveIntensity=.3+fuerza*2.3;lamparaMat.emissiveIntensity=.3+fuerza*1.5;
    const inicio=.20,fin=.88,part=THREE.MathUtils.clamp((p-inicio)/(fin-inicio),0,1);particulasMat.opacity=(p>inicio&&p<.96)?Math.sin(part*Math.PI)*.85:0;
    const a=particulasGeo.attributes.position.array;
    for(let i=0;i<semillas.length;i++){const s=semillas[i],r=s.r*(.3+part*.8),ang=s.a+(reducido?0:part*3);a[i*3]=14.5+Math.cos(ang)*r;a[i*3+1]=11.4+Math.min(4.7,part*4.8*s.v+s.f*.4);a[i*3+2]=9+Math.sin(ang)*r;}
    particulasGeo.attributes.position.needsUpdate=true;
    const aparecer=THREE.MathUtils.clamp((p-.55)/.25,0,1);heartMat.opacity=aparecer*.85;heartPointsMat.opacity=aparecer*.95;
    if(p===1){fase='finalizado';ventanaMat.emissiveIntensity=1.0;lamparaMat.emissiveIntensity=.8;particulasMat.opacity=0;estrellaMat.opacity=0;interfaz();otroBtn.focus();}
  }
  const objetivoCercania0=new THREE.Vector3(10.1,11.7,4.3);
  function actualizar(dt=0){
    if(liberado)return;const paso=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));reloj+=paso;
    castillo.updateWorldMatrix(true,false);camara.getWorldPosition(localCam);castillo.worldToLocal(localCam);
    dentro=localCam.x>7.3&&localCam.x<19.7&&localCam.z> -1.65&&localCam.z<17.7&&localCam.y>10&&localCam.y<16.95;
    cerca=dentro&&localCam.distanceTo(objetivoCercania0)<3.5;
    const visible=oclusion?.habitaciones?.find(h=>h.id===ROOM)?.visible??true;raiz.visible=visible;luz.visible=visible;abrirBtn.hidden=!dentro||!cerca||abierto||Boolean(menu&&!menu.hidden);
    if(fase==='animando'){tiempo+=paso;actualizarAnimacion(tiempo);}
    if(visible){
      for(const m of halosVentana)m.opacity=Math.min(.22,ventanaMat.emissiveIntensity*.065);
      const fiesta=fase==='animando'||fase==='finalizado';
      personas.forEach((p,i)=>{if(p.cabeza){p.cabeza.rotation.y=reducido?0:Math.sin(reloj*.55+i)*.055;p.cabeza.rotation.x=reducido?0:Math.sin(reloj*.7+i)*.018;const t=(reloj+i*.67)%5.6,b=t>5.35?1-.94*Math.sin((t-5.35)/.25*Math.PI):1;p.ojos.forEach(o=>o.scale.y=b);p.sonrisa.scale.x=fiesta?1.10:1;}p.grupo.rotation.z=reducido?0:Math.sin(reloj*(fiesta?2:1)+i)*.014;p.brazos.forEach(b=>{const objetivo=fiesta&&b.lado>0?(2.15+(reducido?0:Math.sin(reloj*5+i)*.18)):b.lado*.14;b.grupo.rotation.z=THREE.MathUtils.damp(b.grupo.rotation.z,objetivo,5,paso);});});
      if(fase==='finalizado'&&!reducido){corazon.scale.setScalar(1+Math.sin(reloj*1.7)*.025);heartPointsMat.opacity=.85+Math.sin(reloj*1.6)*.1;}
      if(fase!=='animando'&&fase!=='finalizado')corazon.scale.setScalar(1);
    }
    if(abierto&&!dentro)cerrar();if(abierto&&menu&&!menu.hidden)menu.hidden=true;
  }
  const api={raiz,hogar,actualizar,abrir,cerrar,enviar,
    vincularControles(c){controles=c;},vincularOclusion(o){oclusion=o;},
    get abierto(){return abierto;},get fase(){return fase;},
    liberar(){
      if(liberado)return;cerrar();liberado=true;
      document.removeEventListener('keydown',teclado,true);document.removeEventListener('pointerlockchange',alDesbloquear);document.removeEventListener('visibilitychange',alOcultar);window.removeEventListener('pagehide',alSalir);window.removeEventListener('pageshow',alMostrar);
      panel.remove();abrirBtn.remove();estilo.remove();raiz.removeFromParent();
      if(Array.isArray(colisiones)){for(const r of propios){const i=colisiones.indexOf(r);if(i>=0)colisiones.splice(i,1);}retirados.sort((a,b)=>a.indice-b.indice).forEach(r=>colisiones.splice(Math.min(r.indice,colisiones.length),0,r.valor));}
      ocultos.forEach(r=>r.objeto.visible=r.visible);for(const g of geometrias)g.dispose();for(const m of materiales)m.dispose();for(const t of texturas)t.dispose();delete castillo.userData.salaDeseosHogar;
    }
  };castillo.userData.salaDeseosHogar=api;return api;
}

exports.FAMILIA_SALA_DESEOS = FAMILIA_SALA_DESEOS;
exports.crearSalaDeseosHogar = crearSalaDeseosHogar;
},
"./apiPlantas.js": function(module, exports, __require) {

// BOTICARIO_IMAGEN_DEFAULT_V3
// BOTICARIO_SOLO_FOTOS_V2
// API publica: solo lecturas. No necesita claves en el frontend.
function crearApiPlantas(opciones = {}) {
  const base = new URL(opciones.baseApi || 'https://api.inaturalist.org/v1/');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  const wikiBase = opciones.wikipediaApi || 'https://es.wikipedia.org/w/api.php';
  const peticion = opciones.fetch || globalThis.fetch.bind(globalThis);
  const intervalo = opciones.intervaloMs ?? 1200;
  const timeoutMs = opciones.timeoutMs ?? 15000;
  const cache = new Map();
  let cola = Promise.resolve(), ultima = 0, esperarHasta = 0, destruido = false;
  const cierre = new AbortController();
  const errorAbort = () => new DOMException('Consulta cancelada', 'AbortError');

  function esPlanta(t) {
    return t && (t.id === 47126 || t.iconic_taxon_name === 'Plantae' ||
      t.ancestor_ids?.includes(47126) || t.ancestors?.some(a => a.id === 47126));
  }
  function urlSegura(valor) {
    if (typeof valor !== 'string' || !valor.trim()) return null;
    try { const u = new URL(valor); return ['http:','https:'].includes(u.protocol) ? u.href : null; }
    catch { return null; }
  }
  function fotoPermitida(t) {
    const fotos = [t.default_photo, ...(t.taxon_photos || []).map(p => p.photo || p)];
    const permitidas = new Set(opciones.licenciasFotos || ['cc0','cc-by','cc-by-sa']);
    for (const f of fotos) {
      const licencia = f?.license_code?.toLowerCase();
      const src = urlSegura(f?.medium_url || f?.url || f?.square_url);
      if (f && src && permitidas.has(licencia)) return {src, licencia, atribucion:f.attribution || 'Autor no indicado', id:f.id};
    }
    return null;
  }
  function normalizar(t) {
    return {id:t.id, nombre:t.preferred_common_name || t.name || 'Nombre no disponible',
      cientifico:t.name || 'No disponible', rango:t.rank || 'No disponible',
      registros:Number.isFinite(t.observations_count) ? t.observations_count : null,
      foto:fotoPermitida(t), ancestros:Array.isArray(t.ancestors)?t.ancestors:[],
      estados:Array.isArray(t.conservation_statuses)?t.conservation_statuses:[],
      fuente:'https://www.inaturalist.org/taxa/'+encodeURIComponent(t.id),
      wikipedia:urlSegura(t.wikipedia_url)};
  }
  function dormir(ms, signal) {
    return new Promise((resolve,reject) => {
      if (signal?.aborted || cierre.signal.aborted) {reject(errorAbort());return;}
      const cancelar=()=>{clearTimeout(timer);limpiar();reject(errorAbort());};
      const limpiar=()=>{signal?.removeEventListener('abort',cancelar);cierre.signal.removeEventListener('abort',cancelar);};
      const timer=setTimeout(()=>{limpiar();resolve();},Math.max(0,ms));
      signal?.addEventListener('abort',cancelar,{once:true});cierre.signal.addEventListener('abort',cancelar,{once:true});
    });
  }
  function json(url,signal) {
    if (signal?.aborted || destruido) return Promise.reject(errorAbort());
    const guardado=cache.get(url);
    if(guardado && Date.now()-guardado.tiempo<300000) return Promise.resolve(guardado.valor);
    const tarea=cola.catch(()=>{}).then(async()=>{
      if(destruido||signal?.aborted)throw errorAbort();
      const pausa=Math.max(0,intervalo-(Date.now()-ultima),esperarHasta-Date.now());
      if(pausa)await dormir(pausa,signal);
      if(destruido||signal?.aborted)throw errorAbort();
      ultima=Date.now();const abortar=new AbortController();let timeout=false;
      const cancelar=()=>abortar.abort();
      signal?.addEventListener('abort',cancelar,{once:true});cierre.signal.addEventListener('abort',cancelar,{once:true});
      const timer=setTimeout(()=>{timeout=true;abortar.abort();},timeoutMs);
      try {
        const r=await peticion(url,{signal:abortar.signal,credentials:'omit',headers:{Accept:'application/json'}});
        if(r.status===429){const s=Number(r.headers.get('Retry-After'));const espera=Number.isFinite(s)&&s>0?s:30;esperarHasta=Date.now()+espera*1000;throw new Error('La fuente limitó las consultas. Espera '+Math.ceil(espera)+' segundos.');}
        if(!r.ok)throw new Error('La fuente respondió HTTP '+r.status+'.');
        const datos=await r.json();if(datos.error)throw new Error(datos.error.info || 'Error comunicado por la fuente.');
        cache.set(url,{tiempo:Date.now(),valor:datos});while(cache.size>50)cache.delete(cache.keys().next().value);return datos;
      }catch(error){if(timeout)throw new Error('La consulta tardó demasiado. Inténtalo de nuevo.');throw error;}
      finally{clearTimeout(timer);signal?.removeEventListener('abort',cancelar);cierre.signal.removeEventListener('abort',cancelar);}
    });
    cola=tarea.catch(()=>{});return tarea;
  }
  async function buscar(texto='',pagina=1,signal) {
    const u=new URL('taxa',base);u.search=new URLSearchParams({taxon_id:'47126',rank:'species',is_active:'true',locale:'es',per_page:'12',page:String(Math.max(1,pagina)),...(texto.trim()?{q:texto.trim().slice(0,80)}:{})});
    const data=await json(u.href,signal);
    const plantas=(data.results || []).filter(esPlanta).map(normalizar);
    return {plantas,total:Number(data.total_results)||0,pagina,porPagina:12};
  }
  async function detalle(id,signal) {
    if(!/^\d+$/.test(String(id)))throw new Error('Identificador de planta inválido.');
    const u=new URL('taxa/'+id,base);u.searchParams.set('locale','es');
    const data=await json(u.href,signal);const t=data.results?.[0];
    if(!t)throw new Error('No se encontró la planta.');
    if(!esPlanta(t))throw new Error('La fuente no confirmó que este registro pertenece al reino Plantae.');
    return normalizar(t);
  }
  async function descripcion(cientifico,signal) {
    if(!cientifico || cientifico==='No disponible')return null;
    const u=new URL(wikiBase);u.search=new URLSearchParams({action:'query',format:'json',origin:'*',prop:'extracts|pageprops|info',inprop:'url',exintro:'1',explaintext:'1',exchars:'1100',redirects:'1',titles:cientifico});
    const data=await json(u.href,signal);
    const pagina=Object.values(data.query?.pages || {}).find(p=>p.pageid>0 && !p.pageprops?.hasOwnProperty('disambiguation') && p.extract?.trim());
    if(!pagina)return null;
    return {texto:pagina.extract, titulo:pagina.title,
      fuente:urlSegura(pagina.fullurl) || 'https://es.wikipedia.org/wiki/'+encodeURIComponent(pagina.title.replaceAll(' ','_'))};
  }
  return {buscar,detalle,descripcion,esPlanta,normalizar,urlSegura,
    liberar(){destruido=true;cierre.abort();cache.clear();}};
}

exports.crearApiPlantas = crearApiPlantas;
},
"./accesosTresPisos.js": function(module, exports, __require) {
const THREE = __THREE;


// Aplicar despues de elevar el castillo, antes de gestores, agrupacion y colisiones.
function crearAccesosTresPisos(castillo) {
  const lista=castillo.userData.colisiones;
  const suelos=[],quitar=new Set();
  const viejo=castillo.getObjectByName('Torre central superior');
  const piedra=(Array.isArray(viejo?.material)?viejo.material[0]:viejo?.material)?.clone()||new THREE.MeshStandardMaterial({color:0x8c8d7b});
  const moldura=piedra.clone();moldura.color.setHex(0xd7c7a2);
  const hierro=new THREE.MeshStandardMaterial({color:0x342f26,roughness:0.7,metalness:0.5});
  const oro=new THREE.MeshStandardMaterial({color:0xba8e45,metalness:0.55,roughness:0.5});
  const llama=new THREE.MeshStandardMaterial({color:0xffda81,emissive:0xff8b2b,emissiveIntensity:2.2});
  const madera=new THREE.MeshStandardMaterial({color:0x69462d,roughness:0.9});
  const geoCaja=new THREE.BoxGeometry(1,1,1);
  const raiz=new THREE.Group();raiz.name='Accesos tres pisos';castillo.add(raiz);
  const eliminarNombre=/^(Escalera interior|Baranda|Baranda lateral|Baranda galeria|Baranda frontal|Baranda descanso|Cornisa principal|Galeria frontal|Galeria posterior)$/;
  castillo.traverse(o=>{if(o.isMesh&&(eliminarNombre.test(o.name)||o===viejo))quitar.add(o);});
  // Son volumenes retirados, no solo mallas ocultas con colisiones activas.
  for(let i=lista.length-1;i>=0;i--)if(quitar.has(lista[i].mesh))lista.splice(i,1);
  for(const o of quitar)o.removeFromParent();
  function caja(nombre,x,y,z,w,h,d,mat=piedra,solido=false) {
    const o=new THREE.Mesh(geoCaja,mat);o.name=nombre;o.position.set(x,y,z);o.scale.set(w,h,d);
    o.castShadow=o.receiveShadow=true;raiz.add(o);
    if(solido)lista.push({mesh:o,w,h,d,esCaja:true});return o;
  }
  function piso(nombre,x,z,w,d,y) {
    caja(nombre,x,y-0.12,z,w,0.24,d,moldura);
    suelos.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,y});
  }
  function baranda(x,z,w,d,y) {
    const o=caja('Baranda nueva',x,y+0.52,z,w,1.04,d,hierro,true);
    // El volumen de colision es continuo; la malla usa listones, no un muro opaco.
    o.visible=false;
    const largo=Math.max(w,d),n=Math.ceil(largo/0.8);
    for(let i=0;i<=n;i++)caja('Balaustre',x+(w>d?-largo/2+i*largo/n:0),y+0.48,z+(d>w?-largo/2+i*largo/n:0),0.07,0.96,0.07,hierro);
    caja('Pasamanos',x,y+1,z,w,0.09,d,hierro);
  }
  // Planta segunda: corredor continuo hasta las cuatro puertas, sin barreras frente a ellas.
  piso('Galeria central oeste',-5.65,-0.0,2.7,36,10);
  piso('Galeria central este',5.65,0,2.7,36,10);
  piso('Galeria central frontal',0,7.65,8.6,20.7,10);
  piso('Galeria central posterior',0,-14.65,8.6,6.7,10);
  piso('Descanso segundo piso',3.65,-7,1.3,1.8,10);
  // El bloque superior se vacia y se reconstruye como envolvente.
  caja('Muro salon superior oeste',-6.9,25.5,-7,0.3,16,12,piedra,true);
  caja('Muro salon superior este',6.9,25.5,-7,0.3,16,12,piedra,true);
  caja('Muro salon superior frente',0,25.5,-1.1,13.6,16,0.3,piedra,true);
  caja('Muro salon superior fondo',0,25.5,-12.9,13.6,16,0.3,piedra,true);
  piso('Salon superior oeste',-5.5,-7,2.4,11.6,17.5);
  piso('Salon superior este',5.5,-7,2.4,11.6,17.5);
  piso('Salon superior frente',0,-1.95,8.6,1.5,17.5);
  piso('Salon superior fondo',0,-12.05,8.6,1.5,17.5);
  piso('Descanso tercer piso',3.65,-7,1.3,1.8,17.5);
  // Tercera planta: sala accesible por la escalera, no un bloque macizo.
  caja('Mesa del salon superior',0,18.1,-12.15,2.8,1.2,0.8,madera,true).userData.habitacion='Salon superior';
  for(const y of [10,17.5]) {
    baranda(-4.3,-7,0.12,8.6,y);
    baranda(0,-11.3,8.6,0.12,y);baranda(0,-2.7,8.6,0.12,y);
    baranda(4.3,-9.6,0.12,3.4,y);baranda(4.3,-4.4,0.12,3.4,y);
  }
  // Una vuelta completa por planta: 28 y 30 peldaños de 0.25 unidades.
  const tramos=[{base:3,n:28},{base:10,n:30}],dosPi=Math.PI*2;
  const geometriaPeldaños=new THREE.BufferGeometry(),pos=[],uv=[];
  function tri(a,b,c){for(const p of [a,b,c]){pos.push(...p);uv.push(p[0]/2,p[2]/2);}}
  function quad(a,b,c,d){tri(a,b,c);tri(a,c,d);}
  function punto(r,a,y){return [Math.cos(a)*r,y,-7+Math.sin(a)*r];}
  for(const t of tramos)for(let i=0;i<t.n;i++) {
    const a=i*dosPi/t.n,b=(i+1)*dosPi/t.n,y=t.base+(i+1)*0.25;
    for(let j=0;j<3;j++) {
      const a1=a+(b-a)*j/3,a2=a+(b-a)*(j+1)/3;
      const p=punto(1.6,a1,y),q=punto(4,a1,y),r=punto(4,a2,y),s=punto(1.6,a2,y);
      quad(p,s,r,q);quad(punto(1.6,a1,y-0.2),punto(4,a1,y-0.2),punto(4,a2,y-0.2),punto(1.6,a2,y-0.2));
      quad(q,r,punto(4,a2,y-0.2),punto(4,a1,y-0.2));
    }
    quad(punto(1.6,a,y),punto(4,a,y),punto(4,a,y-0.2),punto(1.6,a,y-0.2));
    quad(punto(4,b,y),punto(1.6,b,y),punto(1.6,b,y-0.2),punto(4,b,y-0.2));
    if(i>1&&i<t.n-2&&i%2===0) {
      const ang=(a+b)/2;
      caja('Poste caracol',Math.cos(ang)*3.96,y+0.5,-7+Math.sin(ang)*3.96,0.06,1,0.06,hierro);
      const rail=caja('Barra caracol',Math.cos(ang)*3.96,y+1,-7+Math.sin(ang)*3.96,0.07,0.07,(b-a)*3.96*2,hierro);
      rail.rotation.y=-ang;
    }
  }
  geometriaPeldaños.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometriaPeldaños.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometriaPeldaños.computeVertexNormals();
  const matPeldaños=moldura.clone();matPeldaños.side=THREE.DoubleSide;
  const escalera=new THREE.Mesh(geometriaPeldaños,matPeldaños);escalera.name='Caracol transitable';escalera.castShadow=escalera.receiveShadow=true;raiz.add(escalera);
  caja('Nucleo escalera',0,10.3,-7,1.8,14.6,1.8,moldura,true);

  // Portal monumental sin estrechar el vano existente.
  for(const x of [-1.85,1.85]){
    caja('Columna entrada',x,5,18.65,0.5,4,0.65,moldura,true);
    caja('Capitel entrada',x,7.05,18.65,0.8,0.25,0.85,moldura);
  }
  const arcoPos=[];
  for(let i=0;i<20;i++) {
    const a=i*Math.PI/20,b=(i+1)*Math.PI/20;
    const p=(r,t)=>[Math.cos(t)*r,7.1+Math.sin(t)*r,18.75];
    for(const v of [p(1.65,a),p(2,a),p(2,b),p(1.65,a),p(2,b),p(1.65,b)])arcoPos.push(...v);
  }
  const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.Float32BufferAttribute(arcoPos,3));ag.computeVertexNormals();
  const am=moldura.clone();am.side=THREE.DoubleSide;const arco=new THREE.Mesh(ag,am);arco.name='Arco de entrada';raiz.add(arco);

  // Retira fuentes invisibles originales: las nuevas pertenecen a luminarias visibles.
  const lucesAntiguas=[];castillo.traverse(o=>{if(o.isPointLight)lucesAntiguas.push(o);});for(const l of lucesAntiguas)l.removeFromParent();
  function fuente(x,y,z,potencia=110) {
    const l=new THREE.PointLight(0xffc475,potencia,20,2);l.position.set(x,y,z);l.name='Fuente luminaria';raiz.add(l);
  }
  function antorcha(x,y,z,rot=0) {
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;raiz.add(g);
    const palo=new THREE.Mesh(geoCaja,madera);palo.scale.set(0.12,0.85,0.12);g.add(palo);
    const soporte=new THREE.Mesh(geoCaja,hierro);soporte.scale.set(0.35,0.12,0.45);soporte.position.y=-0.25;g.add(soporte);
    const fuego=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.48,6),llama);fuego.position.y=0.57;g.add(fuego);
    fuente(x,y+0.55,z);
  }
  function candelabro(x,y,z) {
    caja('Cadena candelabro',x,y+0.7,z,0.05,1.4,0.05,hierro);
    caja('Brazo candelabro',x,y,z,2.5,0.12,0.12,oro);
    caja('Brazo candelabro',x,y,z,0.12,0.12,2.5,oro);
    for(const [dx,dz] of [[-1.1,0],[1.1,0],[0,-1.1],[0,1.1]]){
      caja('Vela',x+dx,y+0.2,z+dz,0.12,0.4,0.12,moldura);
      const f=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.27,6),llama);f.position.set(x+dx,y+0.51,z+dz);raiz.add(f);
    }
    fuente(x,y+0.4,z,150);
  }
  for(const base of [3,10]) {
    for(const x of [-6.4,6.4])antorcha(x,base+2.7,3,Math.PI/2);
    for(const x of [-13.5,13.5])for(const z of [7,-10])candelabro(x,base+3.8,z);
  }
  antorcha(-2.6,5.2,18.7);antorcha(2.6,5.2,18.7);
  candelabro(0,7.4,10);candelabro(0,22,-7);
  antorcha(-6.4,20,-5,Math.PI/2);antorcha(6.4,20,-5,Math.PI/2);

  const sueloAnterior=castillo.userData.alturaSuelo,bloqueoAnterior=castillo.userData.bloqueado;
  castillo.userData.alturaSuelo=(x,z,pies)=>{
    const lx=x-castillo.position.x,lz=z-castillo.position.z,py=pies-castillo.position.y;
    // Sustituye tambien el soporte invisible de la escalera vieja.
    if(Math.abs(lx)>19.6||lz<-17.6||lz>17.6)return sueloAnterior(x,z,pies);
    let mejor=3;
    const enHueco=Math.abs(lx)<4.3&&lz>-11.3&&lz<-2.7;
    if(py+0.32>=10&&!enHueco)mejor=10;
    for(const s of suelos)if(lx>=s.x1&&lx<=s.x2&&lz>=s.z1&&lz<=s.z2&&s.y<=py+0.32)mejor=Math.max(mejor,s.y);
    const r=Math.hypot(lx,lz+7);
    if(r>=1.6&&r<=4.0) {
      const a=((Math.atan2(lz+7,lx)%dosPi)+dosPi)%dosPi;
      for(const t of tramos) {
        const i=Math.min(t.n-1,Math.floor(a/dosPi*t.n));
        const h=t.base+(i+1)*0.25;
        if(h<=py+0.32)mejor=Math.max(mejor,h);
      }
    }
    return mejor+castillo.position.y;
  };
  castillo.userData.bloqueado=(x,z,pies,h=1.7,r=0.32)=>{
    const lx=x-castillo.position.x,lz=z-castillo.position.z+7,py=pies-castillo.position.y;
    const radio=Math.hypot(lx,lz),angulo=Math.abs(Math.atan2(lz,lx));
    // Borde exterior de la espiral, con apertura en los descansos del lado este.
    if(py>3.25&&py<17.4&&radio>3.72&&radio<4.4&&angulo>0.35)return true;
    return bloqueoAnterior(x,z,pies,h,r);
  };
  castillo.userData.accesosTresPisos={pisos:[3,10,17.5],peldaños:58,centro:{x:0,z:-7},entradaEscalera:{x:3.1,z:-7}};
  return castillo.userData.accesosTresPisos;
}

exports.crearAccesosTresPisos = crearAccesosTresPisos;
}
};
const __cache = Object.create(null);
function __require(id) { if (__cache[id]) return __cache[id].exports; const factory=__modules[id]; if(!factory) throw new Error("Módulo no encontrado: "+id); const module={exports:{}}; __cache[id]=module; factory(module,module.exports,__require); return module.exports; }
__require("./main.js");
