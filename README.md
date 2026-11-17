# iTEP Practice Course · UPSRJ · OBLT

Plataforma de práctica para iTEP Core / iTEP Plus. Sitio estático (HTML + CSS + JS, sin compilación) con Firebase para las cuentas y la base de datos. Se publica en Netlify desde GitHub.

## Flujo

1. **Intro**: WELCOME TO · logo iTEP · PRACTICE COURSE aparecen con fade in y zoom in. Luego todo sube, los textos se desvanecen y el logo se queda.
2. **Inicio**: aparecen los botones CREATE ACCOUNT y LOG IN.
3. **Create account**: el botón se transforma en el título y el logo se reduce. Todos los campos son obligatorios (\*). Solo se aceptan correos `@upsrj.edu.mx`. La contraseña debe tener 8 caracteres o más, con mayúscula, minúscula, número y símbolo.
4. **Send verification e-mail**: se crea la cuenta, se guarda el perfil en Firestore y llega el correo de verificación de Firebase.
5. **Enlace del correo**: regresa a la app y abre LOG IN con la matrícula ya escrita.
6. **Log in**: matrícula + contraseña. Si la cuenta es nueva, va a TAKE DIAGNOSTIC TEST.

## Base de datos (Firestore → colección `users`)

| Campo | Ejemplo |
|---|---|
| firstName | Ana |
| lastName | López Pérez |
| quarter | 3 |
| group | IAEV-31 |
| email | 022000123@upsrj.edu.mx |
| schoolId (matrícula) | 022000123 |
| emailVerified | true / false |
| diagnosticCompleted | false |
| createdAt / lastLogin | fecha |

Las contraseñas **no** se guardan en Firestore; las administra Firebase Authentication de forma segura.

## Modo demo

Mientras `js/firebase-config.js` tenga `PASTE_YOUR_API_KEY`, la app funciona en **modo demo**: las cuentas se guardan solo en ese navegador y el correo se muestra en pantalla. Sirve para probar el flujo completo.

## Configuración de Firebase (una sola vez)

1. Entra a <https://console.firebase.google.com> → **Add project** (por ejemplo, `itep-practice-upsrj`).
2. **Build → Authentication → Get started → Email/Password → Enable**.
3. **Build → Firestore Database → Create database** (modo producción). En la pestaña **Rules**, pega el contenido de `firestore.rules` → **Publish**.
4. **Project settings (⚙️) → Your apps → Web (`</>`)** → registra la app y copia el `firebaseConfig` en `js/firebase-config.js`.
5. **Authentication → Settings → Authorized domains → Add domain**: agrega tu dominio de Netlify (`tu-sitio.netlify.app`).
6. **Authentication → Templates → Email address verification → ✏️**:
   - **Sender name**: `iTEP Practice Course`. **Subject**: `Welcome to the iTEP Practice Course – verify your e-mail`.
   - **Customize action URL** → `https://tu-sitio.netlify.app/`. Así el enlace del correo regresa directo a la app, verifica la cuenta y abre LOG IN.

## GitHub → Netlify (actualización automática)

1. En Netlify: **Add new site → Import an existing project → GitHub** → elige este repositorio.
2. Build command: *(vacío)* · Publish directory: `.` (ya viene en `netlify.toml`).
3. Desde ese momento, cada cambio que se suba a la rama `main` se publica solo.

## Archivos

```
index.html             pantallas
css/styles.css         estilo y animaciones (lienzo 1366×768; versión vertical para celular)
js/app.js              navegación, animaciones y validaciones
js/backend.js          Firebase (o modo demo)
js/firebase-config.js  ← aquí va tu configuración de Firebase
firestore.rules        reglas de seguridad de la base de datos
assets/  fonts/        logos y tipografía Poppins
```
