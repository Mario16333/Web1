// Detectar si estamos en producción (Netlify) o desarrollo (localhost)
const isProduction = window.location.hostname.includes('netlify.app');
const BACKEND_URL = isProduction 
  ? 'https://ffcheats-backend.onrender.com'
  : 'http://localhost:5000';

const fmtBytes=(bytes)=>{ if(!bytes) return ''; const units=['B','KB','MB','GB']; let i=0; let b=Number(bytes); while(b>=1024 && i<units.length-1){ b/=1024; i++; } return b.toFixed(b<10?1:0)+' '+units[i]; };

async function headInfo(url, elId){
  try{
    const res = await fetch(url, { method:'HEAD', credentials:'include', headers:{ 'X-Requested-With':'XMLHttpRequest' } });
    if(!res.ok){ document.getElementById(elId).textContent='No disponible'; return; }
    const size = res.headers.get('content-length');
    const lm = res.headers.get('last-modified');
    const date = lm ? new Date(lm).toLocaleString('es-ES') : '';
    document.getElementById(elId).textContent = (fmtBytes(size) || '') + (date ? (' · actualizado ' + date) : '');
  }catch{ document.getElementById(elId).textContent='No disponible'; }
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
    
    if (!isLoggedIn || !username) {
      console.log('No hay sesión local, redirigiendo al login');
      window.location.href = '/login-simple.html';
      return;
    }

    console.log('Sesión local encontrada, cargando panel...');
    
    // Mostrar información del usuario desde localStorage
    const userNameEl = document.getElementById('userName'); 
    if (userNameEl) userNameEl.textContent = username;
    
    // Intentar obtener información real del backend
    try {
      console.log('Intentando obtener datos del backend...');
      const me = await fetch(`${BACKEND_URL}/api/me`, { 
        credentials:'include',
        headers: {
          'X-Requested-With':'XMLHttpRequest'
        }
      });
      
      if(me.ok) {
        const data = await me.json();
        const user = data.user || {};
        
        // Actualizar nombre de usuario si viene del backend
        if (user.username && userNameEl) {
          userNameEl.textContent = user.username;
        }
        
        // Calcular tiempo restante real
        let timeLeft = 0; 
        let expiry = null;
        if (Array.isArray(user.subscriptions)) {
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
        
        console.log('Tiempo restante real:', timeLeft);
        renderTimer(timeLeft);
        
      } else {
        console.log('No se pudo obtener datos del backend, usando valores por defecto');
        renderTimer(999999999); // Tiempo muy alto para simular infinito
      }
      
    } catch (err) {
      console.log('Error obteniendo datos del backend:', err);
      renderTimer(999999999); // Tiempo muy alto para simular infinito
    }
    
    // Intentar cargar información de archivos
    try {
      headInfo(`${BACKEND_URL}/downloads/Loader.exe`,'exeInfo');
      headInfo(`${BACKEND_URL}/downloads/Requerimientos.zip`,'zipInfo');
    } catch (err) {
      console.log('No se pudieron cargar los archivos:', err);
    }
    
  } catch(err){
    console.error('Error cargando datos:', err);
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    window.location.href = '/login-simple.html';
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
            'X-Requested-With':'XMLHttpRequest'
          }
        }); 
      }catch(err){
        console.error('Error en logout del backend:', err);
      }
      
      // Limpiar localStorage
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      
      window.location.href = '/login-simple.html';
    });
  }
  bootstrap();
}); 