// Lightweight client-side deterrents. Not real security.
(function(){
  const isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

  // Block context menu (basic deterrent)
  document.addEventListener('contextmenu', (e)=>{
    e.preventDefault();
  }, { capture:true });

  // Block common key combos (Ctrl/Cmd+S, U, P, Shift+I/J/C, F12)
  document.addEventListener('keydown', (e)=>{
    const ctrl = isMac ? e.metaKey : e.ctrlKey;
    const blocked = (
      e.key === 'F12' ||
      (ctrl && ['s','u','p'].includes(e.key.toLowerCase())) ||
      (ctrl && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase()))
    );
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture:true });

  // DevTools heuristic detection → blur overlay
  let overlay;
  function ensureOverlay(){
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden','true');
    overlay.style.position='fixed';
    overlay.style.inset='0';
    overlay.style.backdropFilter='blur(8px)';
    overlay.style.background='rgba(0,0,0,0.35)';
    overlay.style.zIndex='99999';
    overlay.style.display='none';
    overlay.style.pointerEvents='none';
    overlay.innerHTML = '<div style="position:absolute;left:50%;top:20%;transform:translateX(-50%);color:#e5e7eb;font-family:Inter,system-ui,-apple-system;opacity:.9;text-align:center">⚠️ Modo inspección detectado<br/><small style="opacity:.8">Protegido</small></div>';
    document.documentElement.appendChild(overlay);
    return overlay;
  }
  function setBlur(active){
    const el = ensureOverlay();
    el.style.display = active ? 'block' : 'none';
  }
  function devtoolsOpen(){
    // Simple heuristic: window size deltas when DevTools docked
    const threshold = 160;
    return (
      Math.abs(window.outerWidth - window.innerWidth) > threshold ||
      Math.abs(window.outerHeight - window.innerHeight) > threshold
    );
  }
  let lastState = false;
  setInterval(()=>{
    const open = devtoolsOpen();
    if (open !== lastState){
      lastState = open;
      setBlur(open);
    }
  }, 1000);

  // Panel watermark with username (deterrent for screenshots)
  function addWatermark(text){
    if (!text) return;
    const wm = document.createElement('div');
    wm.style.position='fixed';
    wm.style.right='6%';
    wm.style.bottom='6%';
    wm.style.zIndex='99998';
    wm.style.pointerEvents='none';
    wm.style.userSelect='none';
    wm.style.opacity='0.08';
    wm.style.fontWeight='900';
    wm.style.fontSize='42px';
    wm.style.letterSpacing='.5px';
    wm.style.color='#ffffff';
    wm.textContent = text + ' • FFCheats';
    document.body.appendChild(wm);
  }
  // If panel page, try to pick username when loaded
  if (location.pathname.endsWith('/panel.html')){
    const tryWatermark = ()=>{
      const nameEl = document.getElementById('userName');
      if (nameEl && nameEl.textContent && nameEl.textContent.trim() && nameEl.textContent.trim() !== 'Usuario'){
        addWatermark(nameEl.textContent.trim());
        return true;
      }
      return false;
    };
    const ok = tryWatermark();
    if (!ok){
      const obs = new MutationObserver(()=>{ if (tryWatermark()) obs.disconnect(); });
      obs.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
    }
  }
})(); 