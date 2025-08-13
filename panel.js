// Detectar si estamos en producción (Netlify) o desarrollo (localhost)
const isProduction = window.location.hostname.includes('netlify.app');
const BACKEND_URL = isProduction 
  ? 'https://ffcheats-backend.onrender.com'
  : 'http://localhost:5000';

console.log('🔧 Panel cargado - Backend URL:', BACKEND_URL);

const fmtBytes=(bytes)=>{ if(!bytes) return ''; const units=['B','KB','MB','GB']; let i=0; let b=Number(bytes); while(b>=1024 && i<units.length-1){ b/=1024; i++; } return b.toFixed(b<10?1:0)+' '+units[i]; };

async function headInfo(url, elId){
  try{
    console.log('📁 Intentando obtener info de archivo:', url);
    
    // Extraer el nombre del archivo de la URL
    const filename = url.split('/').pop();
    console.log('📁 Nombre del archivo:', filename);
    
    // Usar el nuevo endpoint para obtener información detallada
    const fileInfoUrl = `${BACKEND_URL}/api/file-info/${filename}`;
    console.log('📁 URL de info del archivo:', fileInfoUrl);
    
    const res = await fetch(fileInfoUrl, { 
      credentials:'include', 
      headers:{ 
        'X-Requested-With':'XMLHttpRequest',
        'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
      } 
    });
    
    console.log('📁 Respuesta archivo:', res.status, res.statusText);
    
    if(!res.ok){ 
      document.getElementById(elId).textContent='No disponible'; 
      console.log('📁 Archivo no disponible:', res.status);
      return; 
    }
    
    const fileData = await res.json();
    console.log('📁 Datos del archivo:', fileData);
    
    const info = `${fileData.size} · actualizado ${fileData.modified_date}`;
    document.getElementById(elId).textContent = info;
    console.log('📁 Info archivo obtenida:', info);
    
  }catch(err){
    console.error('📁 Error obteniendo archivo:', err);
    document.getElementById(elId).textContent='No disponible';
  }
}

function renderTimer(seconds){
  let timeLeft = Math.max(0, seconds|0);
  const total = timeLeft;
  const el = document.getElementById('timeRemaining');
  const bar = document.getElementById('timeBar');
  function tick(){
    if(timeLeft>0){ timeLeft--; }
    const d=Math.floor(timeLeft/86400), h=Math.floor((timeLeft%86400)/3600), m=Math.floor((timeLeft%3600)/60), s=timeLeft%60;
    let txt=''; if(d>0) txt+=d+'d '; if(h>0) txt+=h+'h '; if(m>0) txt+=m+'m '; if(s>0) txt+=s+'s'; el.textContent = txt.trim()||'0s';
    el.style.color = timeLeft<=0 ? '#ef4444' : (timeLeft<86400 ? '#f59e0b' : '#10b981');
    if(bar && total>0){ const pct = Math.max(0, Math.min(100,(timeLeft/total)*100)); bar.style.width=pct+'%'; bar.style.background= timeLeft<86400? 'linear-gradient(90deg,#f43f5e,#ef4444)' : 'linear-gradient(90deg,#22c55e,#16a34a)'; }
  }
  tick();
  setInterval(tick, 1000);
}

async function bootstrap(){
  try{
    // Verificar si hay sesión local
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!isLoggedIn || !username) {
      console.log('❌ No hay sesión local, redirigiendo al login');
      window.location.href = '/login-simple.html';
      return;
    }

    console.log('✅ Sesión local encontrada, cargando panel...');
    console.log('🔑 Token de sesión:', sessionToken ? 'Presente' : 'Ausente');
    
    // Mostrar información del usuario desde localStorage
    const userNameEl = document.getElementById('userName'); 
    if (userNameEl) userNameEl.textContent = username;
    
    // Intentar obtener información real del backend
    try {
      console.log('🔐 Intentando obtener datos del backend...');
      const me = await fetch(`${BACKEND_URL}/api/me`, { 
        credentials:'include',
        headers: {
          'X-Requested-With':'XMLHttpRequest',
          'Authorization': `Bearer ${sessionToken || ''}`
        }
      });
      
      console.log('📡 Respuesta del backend:', me.status, me.statusText);
      
      if(me.ok) {
        const data = await me.json();
        console.log('📊 Datos del backend:', data);
        const user = data.user || {};
        
        // Actualizar nombre de usuario si viene del backend
        if (user.username && userNameEl) {
          userNameEl.textContent = user.username;
        }
        
        // Calcular tiempo restante real
        let timeLeft = 0; 
        let expiry = null;
        if (Array.isArray(user.subscriptions)) {
          console.log('📅 Suscripciones:', user.subscriptions);
          for (const sub of user.subscriptions){
            if (!timeLeft && typeof sub.timeleft === 'number') timeLeft = sub.timeleft;
            if (!expiry && sub.expiry) expiry = sub.expiry;
          }
        }
        if (!timeLeft && expiry){
          if (typeof expiry === 'string' && /^\d+$/.test(expiry)) { 
            timeLeft = Math.max(0, parseInt(expiry)*1000 - Date.now()); 
            timeLeft = Math.floor(timeLeft/1000); 
          }
          else { 
            const d=new Date(expiry); 
            if(!isNaN(d)) { 
              timeLeft = Math.max(0, Math.floor((d.getTime()-Date.now())/1000)); 
            } 
          }
        }
        
        console.log('⏰ Tiempo restante real:', timeLeft);
        renderTimer(timeLeft);
        
      } else {
        console.log('❌ No se pudo obtener datos del backend, usando valores por defecto');
        console.log('📡 Status:', me.status, me.statusText);
        renderTimer(999999999); // Tiempo muy alto para simular infinito
      }
      
    } catch (err) {
      console.error('💥 Error obteniendo datos del backend:', err);
      renderTimer(999999999); // Tiempo muy alto para simular infinito
    }
    
    // Intentar cargar información de archivos
    console.log('📁 Cargando información de archivos...');
    headInfo(`${BACKEND_URL}/download/Loader.exe`,'exeInfo');
    headInfo(`${BACKEND_URL}/download/Requerimientos.zip`,'zipInfo');
    
  } catch(err){
    console.error('💥 Error cargando datos:', err);
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('sessionToken');
    window.location.href = '/login-simple.html';
  }
}

// Función para descargar archivos desde el servidor Render
async function downloadFile(filename) {
  try {
    console.log('📥 Iniciando descarga de:', filename);
    
    // Obtener token de sesión
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
      console.error('❌ No hay token de sesión');
      alert('Error: No hay sesión activa');
      return;
    }
    
    // Crear URL de descarga
    const downloadUrl = `${BACKEND_URL}/download/${filename}`;
    console.log('📥 URL de descarga:', downloadUrl);
    
    // Usar fetch para descargar con autorización
    const response = await fetch(downloadUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error en la descarga:', response.status, response.statusText);
      alert('Error al descargar el archivo. Verifica tu sesión.');
      return;
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    console.log('📥 Archivo descargado, tamaño:', blob.size);
    
    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Simular clic en el enlace
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar la URL del blob
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Descarga completada para:', filename);
    
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    alert('Error al descargar el archivo. Inténtalo de nuevo.');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      try{ 
        // Intentar logout en el backend (opcional)
        await fetch(`${BACKEND_URL}/api/logout`, { 
          method:'POST', 
          credentials:'include', 
          headers:{
            'X-Requested-With':'XMLHttpRequest',
            'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
          }
        }); 
      }catch(err){
        console.error('Error en logout del backend:', err);
      }
      
      // Limpiar localStorage
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('sessionToken');
      
      window.location.href = '/login-simple.html';
    });
  }
  bootstrap();
}); 