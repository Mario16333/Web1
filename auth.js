console.log('🔍 Login script cargado');
console.log('🔧 Conectando a backend de Render');

// URL del backend en Render
const BACKEND_URL = 'https://ffcheats-backend.onrender.com';

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('statusMessage');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  console.log('🔍 Iniciando proceso de login');

  const username = (document.getElementById('username')?.value || '').trim();
  const password = document.getElementById('password')?.value || '';
  const submitBtn = document.getElementById('submitBtn');

  if (!username || !password) {
    showStatus('Por favor completa todos los campos', 'error');
    return;
  }

  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
  submitBtn.disabled = true;
  showStatus('Conectando al servidor...', 'info');

  try {
    console.log('🔐 Intentando login vía backend de Render...');
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('📡 Respuesta del servidor:', res.status);
    
    const loginResult = await res.json().catch(() => ({ ok:false, error:'Formato de respuesta inválido' }));

    if (res.ok && loginResult.ok) {
      console.log('✅ Login exitoso!');
      
      // Guardar sesión en localStorage
      localStorage.setItem('userLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('loginTime', new Date().toISOString());
      localStorage.setItem('sessionToken', loginResult.token || '');
      
      showStatus('¡Login exitoso! Redirigiendo...', 'success');
      setTimeout(() => { 
        window.location.href = '/panel.html'; 
      }, 600);
    } else {
      console.log('❌ Login fallido:', loginResult?.error);
      showStatus('Error: ' + (loginResult?.error || 'Login failed'), 'error');
    }
  } catch (err) {
    console.error('💥 Error de conexión:', err);
    showStatus('Error de conexión al servidor. Verifica tu conexión a internet.', 'error');
  } finally {
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    submitBtn.disabled = false;
  }
}

(function(){
  document.addEventListener('DOMContentLoaded', function(){
    console.log('🔍 DOM cargado');
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', handleLogin);
      console.log('✅ Formulario configurado');
    }
    const pass = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    if (pass && toggleBtn) {
      toggleBtn.addEventListener('click', ()=>{
        pass.type = pass.type === 'password' ? 'text' : 'password';
        toggleBtn.innerHTML = pass.type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
      });
    }
  });
})(); 