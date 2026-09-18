# Interview Reviewer

Análisis de entrevistas con detección de gestos faciales usando **MediaPipe** (Face Landmarker con blendshapes).

## Estructura

```
├── client/            # Frontend React + Vite
└── server/            # Backend FastAPI (uv + MediaPipe)
    ├── src/interview_reviewer/
    │   ├── domain/            # Entidades y reglas de negocio
    │   ├── application/       # Casos de uso y puertos
    │   ├── infrastructure/    # Adaptadores (mediapipe, video, persistence)
    │   └── entrypoints/       # CLI y API HTTP
    └── models/                # Modelo face_landmarker.task
```

## Requisitos

- [Node.js](https://nodejs.org/) (>= 20)
- [uv](https://docs.astral.sh/uv/)

## Instalación

```bash
npm install                 # client + raíz
cd server && uv sync --extra dev
```

## Desarrollo (backend + frontend)

```bash
npm run dev
```

Lanza la API en `http://localhost:8000` y Vite en `http://localhost:5173`
(con proxy `/api` hacia el backend).

## Producción

```bash
npm start
```

Construye el frontend y sirve client (Vite preview) junto con la API.

## Comandos por separado

- `npm run dev:server` — API FastAPI con recarga automática
- `npm run dev:client` — Vite dev server
- `npm run build` — build del frontend

## API

- `GET /api/health` — estado del servidor y versión de MediaPipe
- `POST /api/analyze` — sube un video y devuelve estadísticas de gestos

## Arquitectura hexagonal

```
server/src/interview_reviewer/
├── domain/            # Entidades y reglas de negocio
│   ├── entities/      # Entidades del dominio
│   └── value_objects/ # Objetos de valor
├── application/       # Casos de uso y contratos
│   ├── ports/         # Puertos (interfaces de entrada/salida)
│   └── use_cases/     # Casos de uso (lógica de aplicación)
├── infrastructure/    # Implementaciones concretas (adaptadores externos)
│   ├── mediapipe/     # Adaptador del modelo de gestos faciales
│   ├── video/         # Lectura/procesamiento de video (OpenCV)
│   └── persistence/   # Persistencia de resultados
└── entrypoints/       # Puntos de entrada (adaptadores primarios)
    ├── cli/           # Interfaz de línea de comandos
    └── api/           # API HTTP
```

## Modelo

El modelo `server/models/face_landmarker.task` (Face Landmarker) produce 478 landmarks
faciales y blendshapes (`output_face_blendshapes=True`), de donde se derivan los
gestos: sonrisa, cejas levantadas, parpadeo, apertura de boca, etc.