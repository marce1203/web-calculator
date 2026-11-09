# Calculadora web

Calculadora estándar, responsive y accesible construida con Vite, TypeScript y DOM vanilla. El motor de cálculo está separado de la interfaz, usa aritmética decimal exacta con `big.js` y respeta la precedencia habitual de operadores.

## Requisitos

- Node.js 22 LTS (o una versión LTS compatible)
- npm

## Instalación

```bash
npm ci
```

## Desarrollo

```bash
npm run dev
```

El servidor usa el puerto `5173` por defecto. También se puede elegir mediante `PORT` o con los argumentos de Vite:

```bash
PORT=4321 npm run dev
npm run dev -- --port 4321 --strictPort
```

## Calidad y tests

```bash
npm run lint
npm test
```

## Compilación y preview

```bash
npm run build
npm run preview
```

La aplicación compilada queda en `dist/`.
