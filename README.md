# SLIME BATTLE

Juego web de slimes con modo de práctica local y partidas en línea de dos
jugadores. El frontend se puede publicar en GitHub Pages; Supabase Realtime
sincroniza las salas y no requiere un servidor Node.js propio ni tablas.

## Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En la configuración del proyecto, copia la URL del proyecto y la clave
   pública `sb_publishable_...` (o la clave pública `anon` heredada).
3. Abre `supabase-config.js` y asigna esos valores a `url` y `publishableKey`.
   La clave pública está diseñada para usarse en el navegador. **No pongas
   aquí una clave `secret` o `service_role`.**
4. Verifica que Realtime esté habilitado en el proyecto.

El juego usa canales públicos de Supabase Realtime y no guarda partidas en la
base de datos. El código/enlace de sala permite encontrar a tu rival; cualquiera
que obtenga ese enlace podría entrar en la sala, así que compártelo solo con la
persona con la que quieres jugar.

## Publicar con GitHub Pages

1. Sube los archivos del proyecto a la rama `main`.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona
   `main` y la carpeta raíz (`/`), y guarda.
4. Abre la URL de Pages que GitHub proporciona. Un jugador crea una sala y
   comparte el enlace generado; el segundo jugador abre ese enlace.

El modo **Practicar sin conexión** funciona sin configurar Supabase.
