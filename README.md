# Elegan-admin

Panel administrativo web independiente de la aplicación móvil.

## Tecnología
- TypeScript
- Next.js
- React
- Despliegue previsto: Vercel

## Desarrollo
```bash
npm install
npm run dev
```

## Configuración
Copia `.env.example` a `.env.local` y configura `NEXT_PUBLIC_API_BASE_URL` con la URL del backend Python.

## Arquitectura
Este repositorio contiene exclusivamente el cliente web administrativo. La autenticación,
autorización y validación de permisos deben realizarse en el backend. No se deben incluir
credenciales privadas en variables `NEXT_PUBLIC_*`.

Los módulos administrativos se implementarán consumiendo rutas protegidas bajo
`/api/admin/...`. La API móvil permanecerá separada bajo `/api/movil/...`.
