'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function OfflineStatus() {
  const [status, setStatus] = useState('Preparing offline');
  const [offline, setOffline] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [prompt, setPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const refreshStatus = async (reg: ServiceWorkerRegistration) => {
    if (reg.waiting) { setStatus('Update available'); return; }
    if (reg.active) {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => { setStatus(event.data.ready ? 'Ready offline' : 'Offline download incomplete'); channel.port1.close(); };
      reg.active.postMessage({ type: 'CACHE_STATUS' }, [channel.port2]);
    }
  };
  useEffect(() => {
    setOffline(!navigator.onLine);
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const online = () => setOffline(!navigator.onLine);
    const install = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const installedHandler = () => { setInstalled(true); setPrompt(undefined); };
    window.addEventListener('online', online); window.addEventListener('offline', online);
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installedHandler);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(reg => {
        setRegistration(reg); void refreshStatus(reg);
        const observe = () => {
          const worker = reg.installing;
          if (!worker) return;
          setStatus('Preparing offline');
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated' || worker.state === 'installed') void refreshStatus(reg);
            if (worker.state === 'redundant') setStatus('Offline download incomplete');
          });
        };
        observe(); reg.addEventListener('updatefound', observe);
        navigator.serviceWorker.ready.then(ready => void refreshStatus(ready));
      }).catch(() => setStatus('Offline download incomplete'));
    } else setStatus(process.env.NODE_ENV === 'production' ? 'Offline unavailable' : 'Preview mode');
    return () => {
      window.removeEventListener('online', online); window.removeEventListener('offline', online);
      window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);
  const act = async () => {
    if (status === 'Update available' && registration?.waiting) {
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (status === 'Offline download incomplete') {
      setStatus('Preparing offline');
      try {
        const reg = registration ?? await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg); await reg.update();
        const worker=reg.installing;
        if(worker)worker.addEventListener('statechange',()=>{
          if(worker.state==='activated'||worker.state==='installed')void refreshStatus(reg);
          if(worker.state==='redundant')setStatus('Offline download incomplete');
        });
        navigator.serviceWorker.ready.then(ready=>void refreshStatus(ready));
        if (!worker) await refreshStatus(reg);
      } catch { setStatus('Offline download incomplete'); }
    } else if (prompt) {
      await prompt.prompt(); await prompt.userChoice; setPrompt(undefined);
    } else help.current?.showModal();
  };
  return <>
    <button className="offline-status" onClick={act} title={installed ? 'Offline app information' : 'Install app or view offline status'}>
      <span className={`status-dot ${status === 'Ready offline' ? 'ready' : ''}`} />
      <span>{offline ? (status === 'Ready offline' ? 'You’re offline · ready' : 'You’re offline') : status}</span>
      <Icon name={status === 'Update available' ? 'download' : 'chevron'} size={13} />
    </button>
    <dialog ref={help} className="info-dialog" aria-labelledby="install-info-title">
      <button className="icon-button dialog-close" aria-label="Close installation information" onClick={() => help.current?.close()}><Icon name="close" /></button>
      <Icon name="moon" size={34} /><h2 id="install-info-title">A little space, always with you.</h2>
      <p>All 78 cards and their meanings are saved on this device once the indicator reads “Ready offline.” Your question and current reading stay in this browser.</p>
      {!installed && <p>To install: use your browser’s <strong>Install app</strong> option. On iPhone or iPad, open Safari’s Share menu and choose <strong>Add to Home Screen</strong>.</p>}
      <p className="muted small">Your browser may remove saved data when storage is low or browsing data is cleared. Reopen online to download it again.</p>
      <button className="button secondary" onClick={() => help.current?.close()}>Got it <Icon name="check" size={16} /></button>
    </dialog>
  </>;
}
