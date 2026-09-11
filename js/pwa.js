let installPrompt=null;
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.querySelectorAll('[data-install-app]').forEach(button=>button.hidden=false);});
document.addEventListener('click',async event=>{const button=event.target.closest('[data-install-app]');if(!button||!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;document.querySelectorAll('[data-install-app]').forEach(x=>x.hidden=true);});
window.addEventListener('appinstalled',()=>document.querySelectorAll('[data-install-app]').forEach(x=>x.hidden=true));
