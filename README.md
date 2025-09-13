# Joycam (PWA)
Web app en vertical para generar imágenes de producto (joyería u otros) con marco dorado, CTA y datos de tienda.

## Scripts
- `npm run dev` — desarrollo
- `npm run build` — compilar
- `npm run preview` — previsualizar build

## Deploy en GitHub Pages (Actions)
- Ajusta `vite.config.ts` → `base: '/Joycam/'`
- Workflow: `.github/workflows/pages.yml`
- Publica en: `https://virusmarcus-max.github.io/Joycam/`

## Notas
- Cámara: requiere HTTPS (Pages lo tiene).
- Compartir: usa Web Share si está disponible; si no, fallbacks a WhatsApp/Telegram web y descarga para Instagram.
- Historial: persiste 2 días por tienda en `localStorage`.
