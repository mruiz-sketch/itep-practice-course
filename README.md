# iTEP Practice Course · UPSRJ · OBLT

Plataforma de práctica para iTEP Core / iTEP Plus. Sitio estático (HTML + CSS + JS, sin compilación) con Firebase para las cuentas y la base de datos. Se publica en **Cloudflare Pages** desde GitHub (antes Netlify, que pausó el sitio por límite de uso).

## Flujo

1. **Intro**: WELCOME TO · logo iTEP · PRACTICE COURSE aparecen con fade in y zoom in. Luego todo sube, los textos se desvanecen y el logo se queda.
2. **Inicio**: aparecen los botones CREATE ACCOUNT y LOG IN.
3. **Create account**: el botón se transforma en el título y el logo se reduce. Todos los campos son obligatorios (\*). Solo se aceptan correos `@upsrj.edu.mx`. La contraseña debe tener 8 caracteres o más, con mayúscula, minúscula, número y símbolo.
4. **Send verification e-mail**: se crea la cuenta, se guarda el perfil en Firestore y llega el correo de verificación de Firebase.
5. **Enlace del correo**: regresa a la app y abre LOG IN con la matrícula ya escrita.
6. **Log in**: matrícula + contraseña. Si la cuenta es nueva, va a TAKE DIAGNOSTIC TEST.

## Examen diagnóstico

- Al dar clic en **TAKE DIAGNOSTIC TEST** empieza el examen: 4 secciones (Grammar, Vocabulary, Listening, Reading) × 8 preguntas = 32, unos 20–25 minutos.
- Las preguntas salen del banco de 500 reactivos (`data/question-bank.json`, copiado de la hoja *iTEP Diagnostic Question Bank (500)*).
- **Adaptativo:** después de cada respuesta se recalcula el nivel estimado del alumno en esa sección y la siguiente pregunta se toma de ese nivel (A1–C2). Cada sección empieza cerca del nivel obtenido en las anteriores.
- **Listening:** el navegador lee el guion en voz alta (dos voces para W/M); se puede escuchar 2 veces. Si el navegador no tiene voces, se muestra el guion para leer.
- **Resultado:** nivel CEFR general, banda tipo iTEP (1.0–6.0), nivel por sección y "What to practice next" (temas que falló). Se guarda en Firestore (`diagnosticLevel`, `diagnosticScore`, `diagnosticSections`, …) y aparece en la pestaña *Students* de cada curso. Solo se puede guardar una vez.
- Si se actualiza la hoja del banco, hay que volver a generar `data/question-bank.json`.

## Docentes

1. En la pantalla inicial: **ARE YOU A TEACHER?** pide el **teachers code** (lo da la administradora; la regla de Firestore también lo exige, y en este repositorio aparece como `TEACHER_CODE_HERE` porque es público). Con el código correcto aparecen su propio **CREATE ACCOUNT** (nombre, apellido, correo institucional y contraseña → correo de verificación) y su propio **LOG IN**.
2. Al entrar por primera vez: **In which quarters are you teaching?** (0 · Immersion a 9th) → **Write the groups you teach** (por cuatrimestre).
3. Se crean las carpetas por cuatrimestre y, dentro, un curso por grupo. Cada curso tiene la pestaña **Students**: alumnos en orden alfabético (apellido) con correo, matrícula y resultado del diagnóstico. Un alumno aparece en el curso cuando su cuatrimestre y su grupo coinciden (no importan mayúsculas, espacios ni guiones: `iaev 31` = `IAEV-31`).
4. **Aprobación:** un docente nuevo ve sus carpetas y cursos, pero **no ve alumnos** hasta que la administradora lo aprueba: Firebase console → Firestore → `users` → documento del docente → campo `approved` → `true`.

## Base de datos (Firestore → colección `users`)

| Campo | Ejemplo |
|---|---|
| firstName | Ana |
| lastName | López Pérez |
| role | student / teacher |
| quarter | 0 (Immersion) a 9 |
| group / groupKey | IAEV-31 / IAEV31 |
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
5. **Authentication → Settings → Authorized domains → Add domain**: agrega el dominio de Cloudflare Pages (`itep-practice-upsrj.pages.dev`).
6. **Correo de verificación**: se usa la plantilla estándar de Firebase. El enlace del correo abre la página de Firebase que confirma la verificación; su botón **Continue** regresa a la app y abre LOG IN con la matrícula escrita. (Por ahora Firebase no permite editar plantillas en proyectos nuevos; cuando lo permita, en *Templates → Customize action URL* se puede poner `https://itep-practice-upsrj.pages.dev/` para saltarse esa página.)

**Sitio en producción:** <https://itep-practice-upsrj.pages.dev> · Proyecto Firebase: `itep-practice-upsrj` (Firestore en `northamerica-south1`, México).

## GitHub → Cloudflare Pages (actualización automática)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → pestaña **Pages** → **Import an existing Git repository** → GitHub.
2. Si no aparece `itep-practice-course`, entra a *Configure GitHub App* y dale acceso a ese repositorio.
3. Project name: `itep-practice-upsrj` · Framework preset: **None** · Build command: *(vacío)* · Build output directory: `/`.
4. **Save and Deploy** → queda en `https://itep-practice-upsrj.pages.dev`. Cada cambio que se suba a `main` se publica solo.
5. Firebase → Authentication → Settings → **Authorized domains** → agregar `itep-practice-upsrj.pages.dev`.

Las cabeceras de caché y seguridad están en `_headers`.

## Archivos

```
index.html             pantallas
css/styles.css         estilo y animaciones (lienzo 1366×768; versión vertical para celular)
js/app.js              navegación, animaciones y validaciones
js/backend.js          Firebase (o modo demo)
js/diagnostic.js       examen diagnóstico adaptativo
data/question-bank.json banco de 500 preguntas
js/teacher.js          área docente: cuatrimestres, grupos, carpetas, cursos y lista de alumnos
js/firebase-config.js  ← aquí va tu configuración de Firebase
firestore.rules        reglas de seguridad de la base de datos
assets/  fonts/        logos y tipografía Poppins
```
