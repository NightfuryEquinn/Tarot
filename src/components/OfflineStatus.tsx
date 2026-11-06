"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "./Language";
import type { CopyKey } from "@/data/interface.zh-CN";
import { Icon } from "./Icon";
import { dialogStyle, iconButton, secondary } from "./ui";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

const OfflineContext = createContext<{
  status: CopyKey;
  offline: boolean;
  installed: boolean;
  act: () => Promise<void>;
} | null>(null);
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { copy } = useLanguage();
  const [status, setStatus] = useState<CopyKey>("Preparing offline");
  const [offline, setOffline] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [prompt, setPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const refreshStatus = async (reg: ServiceWorkerRegistration) => {
    if (reg.waiting) {
      setStatus("Update available");
      return;
    }
    if (reg.active) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        setStatus(
          event.data.ready ? "Ready offline" : "Offline download incomplete",
        );
        channel.port1.close();
      };
      reg.active.postMessage({ type: "CACHE_STATUS" }, [channel.port2]);
    }
  };
  useEffect(() => {
    let cancelled = false;
    let cleanupRegistration = () => {};
    setOffline(!navigator.onLine);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const online = () => setOffline(!navigator.onLine);
    const install = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installedHandler = () => {
      setInstalled(true);
      setPrompt(undefined);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installedHandler);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (cancelled) return;
          setRegistration(reg);
          void refreshStatus(reg);
          const observe = () => {
            const worker = reg.installing;
            if (!worker) return;
            setStatus("Preparing offline");
            worker.addEventListener("statechange", () => {
              if (worker.state === "activated" || worker.state === "installed")
                void refreshStatus(reg);
              if (worker.state === "redundant")
                setStatus("Offline download incomplete");
            });
          };
          observe();
          reg.addEventListener("updatefound", observe);
          cleanupRegistration = () =>
            reg.removeEventListener("updatefound", observe);
          navigator.serviceWorker.ready.then(
            (ready) => void refreshStatus(ready),
          );
        })
        .catch(() => setStatus("Offline download incomplete"));
    } else
      setStatus(
        process.env.NODE_ENV === "production"
          ? "Offline unavailable"
          : "Preview mode",
      );
    return () => {
      cancelled = true;
      cleanupRegistration();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);
  const act = async () => {
    if (status === "Update available" && registration?.waiting) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => location.reload(),
        { once: true },
      );
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else if (status === "Offline download incomplete") {
      setStatus("Preparing offline");
      try {
        const reg =
          registration ?? (await navigator.serviceWorker.register("/sw.js"));
        setRegistration(reg);
        await reg.update();
        const worker = reg.installing;
        if (worker)
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated" || worker.state === "installed")
              void refreshStatus(reg);
            if (worker.state === "redundant")
              setStatus("Offline download incomplete");
          });
        navigator.serviceWorker.ready.then(
          (ready) => void refreshStatus(ready),
        );
        if (!worker) await refreshStatus(reg);
      } catch {
        setStatus("Offline download incomplete");
      }
    } else if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(undefined);
    } else help.current?.showModal();
  };
  return (
    <OfflineContext.Provider value={{ status, offline, installed, act }}>
      {children}
      <dialog
        ref={help}
        className={dialogStyle}
        aria-labelledby="install-info-title"
      >
        <button
          className={`${iconButton} absolute right-3 top-3`}
          aria-label={copy("Close installation information")}
          onClick={() => help.current?.close()}
        >
          <Icon name="close" />
        </button>
        <Icon name="moon" size={34} />
        <h2 id="install-info-title">
          {copy("A little space, always with you.")}
        </h2>
        <p>
          {copy(
            "All 78 cards and their meanings are saved on this device once the indicator reads “Ready offline.” Your question and current reading stay in this browser.",
          )}
        </p>
        {!installed && (
          <p>
            {copy("To install: use your browser’s")}{" "}
            <strong>{copy("Install app")}</strong>{" "}
            {copy(
              "option. On iPhone or iPad, open Safari’s Share menu and choose",
            )}{" "}
            <strong>{copy("Add to Home Screen")}</strong>.
          </p>
        )}
        <p className="text-xs!">
          {copy(
            "Your browser may remove saved data when storage is low or browsing data is cleared. Reopen online to download it again.",
          )}
        </p>
        <button className={secondary} onClick={() => help.current?.close()}>
          {copy("Got it")}
          <Icon name="check" size={16} />
        </button>
      </dialog>
    </OfflineContext.Provider>
  );
}

export function OfflineStatus() {
  const { copy } = useLanguage();
  const context = useContext(OfflineContext);
  if (!context) return null;
  const { status, offline, installed, act } = context;
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 text-[10px] text-muted hover:text-gold"
      onClick={act}
      title={
        installed
          ? copy("Offline app information")
          : copy("Install app or view offline status")
      }
    >
      <span
        className={`size-1.5 rounded-full ${status === "Ready offline" ? "bg-[#a7c6aa] shadow-[0_0_6px_#a7c6aa50]" : "bg-gold/60"}`}
      />
      <span>
        {offline
          ? status === "Ready offline"
            ? copy("You’re offline · ready")
            : copy("You’re offline")
          : copy(status)}
      </span>
      <Icon
        name={status === "Update available" ? "download" : "chevron"}
        size={13}
      />
    </button>
  );
}
