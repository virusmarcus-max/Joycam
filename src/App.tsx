// Version 2.0 — FIX: cierre correcto de funciones y variables duplicadas
import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaUpload, FaTimes, FaWhatsapp, FaDownload, FaExpand, FaCompress } from "react-icons/fa";

// Tiendas (teléfono y WhatsApp distintos)
const stores: Record<string, { address: string; password: string; phone: string; whatsapp: string }> = {
  "Cordoba":  { address: "Calle los Omeyas 1", password: "4829", phone: "957 000 111", whatsapp: "611 001 001" },
  "Jerez":    { address: "Calle Medina 4", password: "1573", phone: "956 000 222", whatsapp: "611 002 002" },
  "Granada":  { address: "Calle Emperatriz Eugenia 3", password: "9062", phone: "958 000 333", whatsapp: "611 003 003" },
  "Malaga 1": { address: "Calle Mauricio Moro Pareto 3", password: "7340", phone: "952 000 444", whatsapp: "611 004 004" },
  "Malaga 2": { address: "Avenida Velasquez 31", password: "2185", phone: "952 000 555", whatsapp: "611 005 005" },
  "Sevilla 1":{ address: "Calle Maria Auxiliadora 18", password: "6391", phone: "954 000 666", whatsapp: "630 61 08 93" },
  "Sevilla 2":{ address: "Avenida Eduardo Dato 83", password: "5274", phone: "954 000 777", whatsapp: "626 58 77 72" },
};

type HistoryItem = { image: string; date: string; ref: string; store: string; ts: number };
type TipoFoto = "joyeria" | "otros";

const JoycamLogoIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" aria-label="joyeria fotografia logo">
    <rect x="15" y="30" width="90" height="60" rx="10" ry="10" fill="#fff" stroke="#ff1493" strokeWidth="5" />
    <circle cx="95" cy="25" r="8" fill="url(#gold)" stroke="#fff" strokeWidth="2" />
    <circle cx="60" cy="60" r="22" fill="url(#gold)" stroke="#c27c0e" strokeWidth="3" />
    <polygon points="60,40 74,60 60,80 46,60" fill="#fff176" stroke="#fbc02d" strokeWidth="2" />
    <rect x="40" y="15" width="40" height="10" rx="2" ry="2" fill="#ff1493" />
    <defs>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f9d976" />
        <stop offset="50%" stopColor="#f39c12" />
        <stop offset="100%" stopColor="#c27c0e" />
      </linearGradient>
    </defs>
  </svg>
);

const Spinner = () => (
  <div style={{ border: "4px solid #fff", borderTop: "4px solid #ff69b4", borderRadius: "50%", width: 30, height: 30, animation: "spin 1s linear infinite" }} />
);

export default function App() {
  const [store, setStore] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoFoto>("joyeria");
  const [desc, setDesc] = useState("");
  const [grams, setGrams] = useState("");
  const [price, setPrice] = useState("");
  const [refCode, setRefCode] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [lastRef, setLastRef] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      const doc: any = document;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange as any);
    document.addEventListener('msfullscreenchange', onFsChange as any);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange as any);
      document.removeEventListener('msfullscreenchange', onFsChange as any);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      const doc: any = document;
      const el: any = document.documentElement;
      if (!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement)) {
        (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
      } else {
        (doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen)?.call(doc);
      }
    } catch (e) { /* no-op */ }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auth
  const handleLogin = () => {
    if (store && password === stores[store].password) setLoggedIn(true);
    else alert("Usuario o contraseña incorrecta");
  };
  const handleLogout = () => {
    setLoggedIn(false);
    setPassword("");
    setStore("");
    resetWorkArea();
    setHistory([]);
  };

  // Reset
  const resetWorkArea = () => {
    setImage(null); setTipo("joyeria"); setDesc(""); setGrams(""); setPrice(""); setRefCode(""); setBrandModel(""); setGenerated(false); setGeneratedDataUrl(null); setLastRef("");
  };

  // Imagen
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };
  const handleOpenCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment"); // iOS/Android
    input.onchange = (e: any) => handleImageUpload(e);
    // Permitir volver a elegir la misma foto
    (input as any).value = "";
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
  };
  const handleRemoveImage = () => { resetWorkArea(); };

  // Texto multilínea centrado (devuelve alto usado)
  const drawWrappedClamped = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) => {
    if (!text) return 0;
    ctx.textAlign = "center";
    const words = text.split(" ");
    let line = "";
    let linesUsed = 0;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const w = ctx.measureText(testLine).width;
      if (w > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, y);
        y += lineHeight;
        linesUsed++;
        line = words[n] + " ";
        if (linesUsed >= maxLines - 1) {
          let rest = line + words.slice(n + 1).join(" ");
          while (ctx.measureText(rest + " …").width > maxWidth && rest.length > 0) rest = rest.slice(0, -1);
          ctx.fillText((rest + " …").trim(), x, y);
          return (linesUsed + 1) * lineHeight;
        }
      } else {
        line = testLine;
      }
    }
    if (line) { ctx.fillText(line.trim(), x, y); linesUsed++; }
    return linesUsed * lineHeight;
  };

  // Generación de imagen en canvas (CORREGIDO)
  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !store) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setLoading(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Fondo negro
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Marca de agua principal
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 52px Georgia, serif";
      ctx.fillText("CASH CONVERTERS", 0, 0);
      ctx.font = "bold 28px Georgia, serif";
      ctx.fillText(store.toUpperCase(), 0, 50);
      ctx.restore();

      // Marco dorado fino
      const gold = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gold.addColorStop(0, "#f9d976");
      gold.addColorStop(0.5, "#f39c12");
      gold.addColorStop(1, "#c27c0e");
      ctx.strokeStyle = gold;
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

      // Título
      ctx.font = "bold 26px Georgia, serif";
      ctx.fillStyle = gold;
      ctx.textAlign = "center";
      const titleY = 56;
      ctx.fillText("CASH CONVERTERS", canvas.width / 2, titleY);

      // Descripción (más grande y más abajo)
      ctx.fillStyle = "#fff";
      ctx.font = "22px Georgia, serif"; // ↑ tamaño
      const descStartY = titleY + 36; // ↓ un poco más abajo
      const usedDescH = drawWrappedClamped(ctx, desc || "", canvas.width / 2, descStartY, canvas.width - 40, 28, 2);

      // Foto: más grande y ajustada a laterales con único banner arriba/abajo
      const photoTop = descStartY + (usedDescH || 0) + 4; // margen superior mínimo
      const sideMargin = 1; // laterales casi a ras
      const reservedFooter = 142; // pie más compacto
      const availW = canvas.width - sideMargin * 2;
      const availH = canvas.height - photoTop - reservedFooter;
      const ratio = Math.min(availW / img.width, availH / img.height);
      const drawW = Math.round(img.width * ratio);
      const drawH = Math.round(img.height * ratio);
      const x = Math.round((canvas.width - drawW) / 2);
      const y = Math.round(photoTop);
      ctx.drawImage(img, x, y, drawW, drawH);
      ctx.lineWidth = 2; ctx.strokeStyle = gold; ctx.strokeRect(x, y, drawW, drawH);

      // Pie reagrupado y con tipografías un poco más pequeñas
      let cursorY = y + drawH + 22;
      // 1) Línea grande (Joyería: gr + €) (Otros: marca y modelo + €)
      ctx.fillStyle = gold; ctx.font = "bold 22px Georgia, serif";
      const big: string[] = [];
      if (tipo === "joyeria") {
        if (grams) big.push(`${grams} gr`);
        if (price) big.push(`${price} €`);
      } else {
        if (brandModel) big.push(brandModel);
        if (price) big.push(`${price} €`);
      }
      const bigLine = big.join("   ");
      if (bigLine) { ctx.fillText(bigLine, canvas.width / 2, cursorY); cursorY += 20; }

      // 2) Referencia (más pequeña) con etiqueta
      if (refCode) { ctx.fillStyle = "#fff"; ctx.font = "12px Georgia, serif"; ctx.fillText(`Referencia: ${refCode}`, canvas.width / 2, cursorY); cursorY += 18; }

      // 3) CTA
      ctx.fillStyle = gold; ctx.font = "bold 20px Georgia, serif"; ctx.fillText("¡Llámanos y resérvalo ya!", canvas.width / 2, cursorY + 4); cursorY += 22;

      // 4) Tienda + dirección en UNA sola línea (ajuste de tamaño automático)
      ctx.fillStyle = "#fff";
      const tdText = `${store}  ·  📍 ${stores[store].address}`;
      let tdSize = 14; // un poco más pequeño
      const tdMax = canvas.width - 28;
      ctx.font = `bold ${tdSize}px Georgia, serif`;
      while (ctx.measureText(tdText).width > tdMax && tdSize > 12) {
        tdSize -= 1;
        ctx.font = `bold ${tdSize}px Georgia, serif`;
      }
      ctx.fillText(tdText, canvas.width / 2, cursorY + tdSize - 2);
      cursorY += tdSize + 6;

      // 5) Teléfono y WhatsApp en UNA sola línea con auto-ajuste
      ctx.fillStyle = "#fff";
      const phonesText = `☎ ${stores[store].phone}   ·   🟢 ${stores[store].whatsapp}`;
      let phSize = 13; // ligeramente más pequeño
      const phMax = canvas.width - 36;
      ctx.font = `${phSize}px Georgia, serif`;
      while (ctx.measureText(phonesText).width > phMax && phSize > 11) {
        phSize -= 1;
        ctx.font = `${phSize}px Georgia, serif`;
      }
      ctx.fillText(phonesText, canvas.width / 2, cursorY + phSize - 2);
      cursorY += phSize + 6;

      // Joycam (texto) – marca de agua suave
      ctx.save(); ctx.globalAlpha = 0.35; ctx.textAlign = "left"; ctx.font = "bold 13px Georgia, serif"; ctx.fillStyle = "#fff"; ctx.fillText("Joycam", 12, canvas.height - 12); ctx.restore();

      // Fecha corta — marca de agua horizontal en esquina inferior derecha (declarada UNA sola vez)
      const fechaCorta = new Date().toLocaleDateString("es-ES", { year: "2-digit", month: "2-digit", day: "2-digit" });
      ctx.save(); ctx.globalAlpha = 0.35; ctx.textAlign = "right"; ctx.font = "bold 14px Georgia, serif"; ctx.fillStyle = "#fff"; ctx.fillText(fechaCorta, canvas.width - 12, canvas.height - 12); ctx.restore();

      setGenerated(true);
      setLoading(false);
      const dataUrl = canvas.toDataURL();
      setGeneratedDataUrl(dataUrl);
      setLastRef(refCode || (tipo === "otros" ? brandModel : ""));
      // Reset para siguiente trabajo
      setImage(null); setDesc(""); setGrams(""); setPrice(""); setRefCode(""); setBrandModel("");
    };
    img.src = image;
  };

  // Nuevo upload: archiva la imagen generada previa en historial
  const handleNewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (generated && generatedDataUrl) {
      const fecha = new Date().toLocaleDateString("es-ES", { year: "2-digit", month: "2-digit", day: "2-digit" });
      setHistory((prev) => [...prev, { image: generatedDataUrl, date: fecha, ref: lastRef || "-", store, ts: Date.now() }]);
    }
    handleImageUpload(e);
    setGenerated(false);
    setGeneratedDataUrl(null);
    setLastRef("");
  };

  // Compartir / descargar
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const makeFileName = (name?: string) => {
    const base = (name || 'joycam').toString().trim() || 'joycam';
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 60);
    return `${safe}.png`;
  };
  const shareDataUrl = (platform: string, dataUrl: string, filename?: string) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(b => {
        const file = new File([b], "joycam.png", { type: "image/png" });
        const canShareFiles = (navigator as any).canShare && (navigator as any).canShare({ files: [file] });
        if ((navigator as any).share && canShareFiles && (platform === "whatsapp" || platform === "telegram" || platform === "instagram")) {
          (navigator as any).share({ files: [file], title: "Joycam" });
          return;
        }
        // Fallbacks robustos para móvil web
        if (platform === "download") {
          const a = document.createElement("a");
          const url = URL.createObjectURL(b);
          a.href = url; a.download = makeFileName(filename);
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          if (isIOS()) window.open(dataUrl, "_blank"); // iOS a veces ignora download
          return;
        }
        if (platform === "whatsapp") {
          // Intento directo a la app y fallback web
          const text = encodeURIComponent("Imagen generada con Joycam");
          const deep = `whatsapp://send?text=${text}`;
          const web = `https://wa.me/?text=${text}`;
          window.location.href = deep;
          setTimeout(() => window.open(web, "_blank"), 400);
          return;
        }
        if (platform === "telegram") {
          const url = `https://t.me/share/url?url=${encodeURIComponent(dataUrl)}&text=${encodeURIComponent("Imagen Joycam")}`;
          window.open(url, "_blank");
          return;
        }
        if (platform === "instagram") {
          alert("Instagram no permite compartir directo desde navegador. Descarga la imagen y súbela desde la app.");
          return;
        }
      });
  };

  const shareImage = (platform: string, filename?: string) => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    shareDataUrl(platform, dataUrl, filename);
  };

  // Historial persistente por tienda en localStorage + retención 2 días
  const STORAGE_KEY = "joycam_history_v2";
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

  // Cargar + purgar al cambiar de tienda o iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      // Normaliza y purga >2 días (mantenemos entradas de todas las tiendas; la UI filtra por tienda)
      const normalized = arr
        .filter((h: any) => h && h.image)
        .map((h: any) => ({ ...h, store: h.store || store, ts: h.ts || now }))
        .filter((h: any) => now - h.ts <= TWO_DAYS);
      setHistory(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) { /* no-op */ }
  }, [store]);

  // Guardar cualquier cambio del historial
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) { /* no-op */ }
  }, [history]);

  // UI
  return !loggedIn ? (
    <div style={{ fontFamily: "'Trebuchet MS', sans-serif", textAlign: "center", padding: 20, backgroundColor: "#fff", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ backgroundColor: "#ff1493", padding: 16, borderRadius: 12, marginBottom: 24, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%", maxWidth: 420 }}>
        <JoycamLogoIcon size={72} />
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: 1 }}>Joycam</h1>
      </div>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <select value={store} onChange={(e) => setStore(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 10, border: "1px solid #ddd" }}>
          <option value="">Selecciona tu tienda</option>
          {Object.keys(stores).map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 10, border: "1px solid #ddd" }} />
        <button onClick={handleLogin} style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, backgroundColor: "#ff69b4", color: "white", fontWeight: 800 }}>Entrar</button>
      </div>
    </div>
  ) : (
    <div style={{ fontFamily: "'Trebuchet MS', sans-serif", textAlign: "center", padding: 12, backgroundColor: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} } body, html, #root { height: 100%; }`}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#ff1493", color: "white", padding: 12, marginBottom: 12, display: "flex", alignItems: "center" }}>
        {/* Izquierda: logo + nombre app */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <JoycamLogoIcon size={44} />
          <div style={{ fontWeight: 900, fontSize: 20 }}>Joycam</div>
        </div>
        {/* Centro: tienda + dirección centradas */}
        <div style={{ flex: 1, textAlign: "center", lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{store}</div>
          <div style={{ fontSize: 11, opacity: 0.95 }}>{stores[store].address}</div>
        </div>
        {/* Derecha: fullscreen + salir */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"} style={{ background: "#fff", color: "#ff1493", border: "none", borderRadius: 8, width: 36, height: 36, display: "grid", placeItems: "center" }} aria-label="Pantalla completa">
            {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </button>
          <button onClick={handleLogout} style={{ background: "#fff", color: "#ff1493", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800 }}>Salir</button>
        </div>
      </header>

      <main style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, alignItems: "center" }}>
        {!image && (
          <>
            <p style={{ color: "#777", margin: 0 }}>Añade una foto para empezar</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
              <button type="button" onClick={handleOpenCamera} onTouchStart={handleOpenCamera} style={{ width: 56, height: 56, backgroundColor: "#ff69b4", color: "white", border: "none", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FaCamera size={24} />
              </button>
              <label style={{ width: 56, height: 56, backgroundColor: "#ff69b4", color: "white", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
                <FaUpload size={24} />
                <input type="file" accept="image/*" onChange={handleNewUpload} style={{ display: "none" }} />
              </label>
            </div>
          </>
        )}

        {image && !generated && (
          <>
            <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
              
              <img src={image} alt="preview" style={{ width: 160, height: 160, objectFit: "cover", border: "1px solid #ddd", borderRadius: 8 }} />
              <button onClick={handleRemoveImage} style={{ position: "absolute", top: -8, right: -8, background: "red", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FaTimes size={10} />
              </button>
            </div>

            {/* Selector de tipo */}
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={() => setTipo("joyeria")} style={{ padding: "8px 10px", borderRadius: 10, border: tipo === "joyeria" ? "2px solid #ff1493" : "1px solid #ccc", background: tipo === "joyeria" ? "#ffe4f1" : "#fff" }}>Joyería</button>
              <button onClick={() => setTipo("otros")} style={{ padding: "8px 10px", borderRadius: 10, border: tipo === "otros" ? "2px solid #ff1493" : "1px solid #ccc", background: tipo === "otros" ? "#ffe4f1" : "#fff" }}>Otros</button>
            </div>

            {/* Formularios */}
            <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
              {tipo === "joyeria" ? (
                <>
                  <input placeholder="Gramos" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                  <input placeholder="Precio" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                  <input placeholder="Referencia" value={refCode} onChange={(e) => setRefCode(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                </>
              ) : (
                <>
                  <input placeholder="Marca y modelo" value={brandModel} onChange={(e) => setBrandModel(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                  <input placeholder="Referencia" value={refCode} onChange={(e) => setRefCode(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                  <input placeholder="Precio" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
                </>
              )}
            </div>

            <button onClick={handleGenerate} disabled={loading} style={{ width: 100, height: 100, marginTop: 8, backgroundColor: loading ? "#ccc" : "#ff69b4", border: "none", borderRadius: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
              {loading ? <Spinner /> : <JoycamLogoIcon size={56} />}
            </button>
          </>
        )}

        {/* Canvas vertical */}
        <canvas ref={canvasRef} width={360} height={640} style={{ border: "1px solid #eee", borderRadius: 12, marginTop: 8, display: generated ? "block" : "none", width: 360, height: 640 }} />

        {generated && (
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8 }}>
            <button type="button" onClick={() => shareImage("whatsapp")} onTouchStart={() => shareImage("whatsapp")} style={{ minWidth: 44, minHeight: 44 }} aria-label="Compartir por WhatsApp"><FaWhatsapp size={24} color="#25D366" /></button>
            <button type="button" onClick={() => shareImage("download", lastRef)} onTouchStart={() => shareImage("download", lastRef)} style={{ minWidth: 44, minHeight: 44 }} aria-label="Descargar imagen"><FaDownload size={24} /></button>
          </div>
        )}

        {history.filter(h => h.store === store).length > 0 && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, 90px)", gap: 10, justifyContent: "center", width: "100%", maxWidth: 420 }}>
            {history.filter(h => h.store === store).map((h, idx) => (
              <div key={idx} style={{ width: 90 }}>
                <img src={h.image} alt={`hist-${idx}`} style={{ width: 90, height: 90, objectFit: "cover", border: "1px solid #ddd", borderRadius: 8 }} />
                <div style={{ fontSize: 10, color: "#555", marginTop: 2, textAlign: "center" }}>{h.date} · Ref: {h.ref || "-"}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 4 }}>
                  <button type="button" onClick={() => shareDataUrl("whatsapp", h.image)} onTouchStart={() => shareDataUrl("whatsapp", h.image)} title="Compartir WhatsApp" style={{ width: 34, height: 34, display: "grid", placeItems: "center" }} aria-label="Compartir WhatsApp"><FaWhatsapp size={16} color="#25D366" /></button>
                  <button type="button" onClick={() => shareDataUrl("download", h.image, h.ref)} onTouchStart={() => shareDataUrl("download", h.image, h.ref)} title="Descargar" style={{ width: 34, height: 34, display: "grid", placeItems: "center" }} aria-label="Descargar"><FaDownload size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


/* ===== Archivos mínimos para Web App/PWA (GitHub Pages) =====
   1) public/manifest.webmanifest
{
  "name":"Joycam","short_name":"Joycam","start_url":".",
  "display":"standalone","orientation":"portrait",
  "background_color":"#ffffff","theme_color":"#ff1493",
  "icons":[{"src":"icons/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icons/icon-512.png","sizes":"512x512","type":"image/png"}]
}
   2) public/sw.js
const CACHE='joycam-v1';self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest'])))});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))))});self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;})))});
   3) index.html (Vite)
<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no"/><meta name="theme-color" content="#ff1493"/><link rel="manifest" href="./manifest.webmanifest"/><link rel="apple-touch-icon" href="./icons/icon-192.png"/><title>Joycam</title></head><body><div id="root"></div><script type="module" src="./src/main.tsx"></script><script>if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));}</script></body></html>
   4) vite.config.ts
import { defineConfig } from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],base:'/REPO_NAME/'});
   5) package.json
{ "name":"joycam-web","private":true,"type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview --port 5173"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0","react-icons":"^4.11.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.0","vite":"^5.0.0","typescript":"^5.2.0"}}
   * Backend opcional (Express) para alojar fuera de GitHub Pages — ver ejemplo en siguiente mensaje si lo deseas. */
