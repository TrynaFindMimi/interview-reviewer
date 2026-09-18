# Interview Reviewer

Análisis de entrevistas con detección de gestos faciales usando **MediaPipe** (Face Landmarker con blendshapes).

## Requisitos

- [uv](https://docs.astral.sh/uv/)

## Instalación

```bash
uv sync --extra dev
```

## Uso

```bash
uv run interview-reviewer
```

## Arquitectura hexagonal

```
src/interview_reviewer/
├── domain/            # Entidades y reglas de negocio
│   ├── entities/      # Entidades del dominio
│   └── value_objects/ # Objetos de valor
├── application/       # Casos de uso y contratos
│   ├── ports/         # Puertos (interfaces de entrada/salida)
│   └── use_cases/     # Casos de uso (lógica de aplicación)
├── infrastructure/    # Implementaciones concretas (adapteres externos)
│   ├── mediapipe/     # Adaptador del modelo de gestos faciales
│   ├── video/         # Lectura/procesamiento de video (OpenCV)
│   └── persistence/   # Persistencia de resultados
└── entrypoints/       # Puntos de entrada (adaptadores primarios)
    ├── cli/           # Interfaz de línea de comandos
    └── api/           # API HTTP
```

## Modelo

El modelo `models/face_landmarker.task` (Face Landmarker) produce 478 landmarks
faciales y blendshapes (`output_face_blendshapes=True`), de donde se derivan los
gestos: sonrisa, cejas levantadas, parpadeo, apertura de boca, etc.