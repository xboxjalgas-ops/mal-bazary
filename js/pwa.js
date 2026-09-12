let installPrompt=null;
const installButtons=()=>document.querySelectorAll('[data-install-app]');
function showInstallButtons(){installButtons().forEach(button=>button.hidden=false);}
function hideInstallButtons(){installButtons().forEach(button=>button.hidden=true);}
function installFallbackMessage(){
  const message='Қолданбаны орнату үшін браузер мәзірінен “Install app”, “Add to Home Screen” немесе “Қолданбаны орнату” таңдаңыз.';
  if(typeof showToast==='function')showToast(message);else alert(message);
}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
document.addEventListener('DOMContentLoaded',showInstallButtons);
window.addEventListener('load',showInstallButtons);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;showInstallButtons();});
document.addEventListener('click',async event=>{const button=event.target.closest('[data-install-app]');if(!button)return;if(!installPrompt){installFallbackMessage();return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;hideInstallButtons();});
window.addEventListener('appinstalled',hideInstallButtons);
