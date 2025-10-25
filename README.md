# Créditos Verde Banorte

## Descripción General

Créditos Verde Banorte es una plataforma financiera que permite a usuarios solicitar, gestionar y monitorear créditos verdes, así como administrar sus transacciones y productos sustentables. El sistema cuenta con roles de cliente y administrador, y una arquitectura robusta basada en tecnologías modernas para backend y frontend.

---

## Arquitectura General

- **Backend:** FastAPI (Python), SQLModel (ORM), SQLAlchemy (async), Pydantic, PostgreSQL/MySQL/SQLite (según despliegue)
- **Frontend:** React (TypeScript), Vite, Axios, Context API
- **Infraestructura:** API RESTful, separación de responsabilidades por routers, modelos y controladores
- **Seguridad:** Validación de datos con Pydantic, manejo de errores explícito, CORS habilitado

---

## Modelado de Base de Datos

### Cliente
- Campos: nombre, apellido, username (único), edad, fecha_nacimiento, saldo, credit_score, ciudad, pwd
- Relaciones: Un cliente puede tener muchos créditos y transacciones

### Admin
- Campos: nombre, apellido, username (único), pwd

### Crédito
- Campos: prestamo, interes, meses_originales, deuda_acumulada, pagado, categoria, estado, descripcion, gasto_inicial_mes, gasto_final_mes, cliente_id, item_id, fecha_inicio
- Relaciones: Pertenece a un cliente y opcionalmente a un item

### Item (Producto Verde)
- Campos: nombre, precio, link, img_link, categoria
- Relaciones: Un item puede estar en muchos créditos

### Transacción
- Campos: cliente_id, monto, categoria, descripcion, fecha
- Relaciones: Pertenece a un cliente

---

## Endpoints Principales

### Cliente
- `POST /clientes/signup`: Registro de cliente
- `POST /clientes/login`: Login de cliente
- `GET /clientes/{cliente_id}`: Consulta de datos de cliente
- `PATCH /clientes/{cliente_id}`: Actualización de datos
- `GET /clientes/{cliente_id}/gastos_mensuales`: Gasto mensual por categoría
- `GET /clientes/{cliente_id}/creditos`: Créditos del cliente (por estado)
- `GET /clientes/{cliente_id}/transacciones`: Transacciones del cliente

### Admin
- `POST /admin/signup`: Registro de admin
- `POST /admin/login`: Login de admin
- `GET /admin/manage_credits`: Listado y gestión de créditos (por estado)
- `PATCH /admin/manage_credits/cambiar-estado/{credito_id}`: Cambiar estado de crédito

### Créditos
- `POST /creditos/`: Crear crédito verde
- `GET /creditos/`: Listar créditos
- `PATCH /creditos/{credito_id}`: Actualizar crédito

### Items (Productos Verdes)
- `POST /items/`: Crear producto verde
- `GET /items/`: Listar productos verdes

### Transacciones
- `POST /transacciones/`: Crear transacción (no afecta saldo)
- `POST /transacciones/registrar`: Crear transacción y actualizar saldo del cliente (con validación de fondos)
- `GET /transacciones/`: Listar transacciones
- `GET /transacciones/cliente/{cliente_id}`: Listar transacciones de un cliente

### Productos (API externa)
- `GET /productos/buscar/`: Buscar productos verdes usando API externa

---

## Frontend

- **Login y Dashboard:** Páginas de login y dashboard de usuario, protegidas por contexto de autenticación.
- **Consumo de API:** Axios, URLs configurables por `.env`, manejo de errores y estados de carga.
- **Rutas:** React Router para navegación entre login y dashboard.
- **Actualización de saldo:** El frontend actualiza el saldo del usuario tras registrar transacciones.

---

## Justificación de Diseño

- **FastAPI + SQLModel:** Permite desarrollo rápido, validación automática y documentación interactiva.
- **Separación de routers:** Facilita el mantenimiento y escalabilidad.
- **Modelos Pydantic:** Garantizan integridad y validación de datos.
- **Endpoints RESTful:** Claridad y estandarización para integración con frontend y otros servicios.
- **Frontend moderno:** React + Vite para desarrollo ágil, recarga rápida y tipado seguro con TypeScript.
- **API externa de productos:** Permite enriquecer la experiencia del usuario con productos verdes reales.

---

## Tecnologías Empleadas

- **Backend:** Python, FastAPI, SQLModel, SQLAlchemy, Pydantic, AsyncIO
- **Frontend:** React, TypeScript, Vite, Axios
- **Base de datos:** SQL (ORM agnóstico)
- **Infraestructura:** Uvicorn, CORS, .env para configuración
- **APIs externas:** RapidAPI para productos verdes

---

## Diagrama Simplificado

```mermaid
graph TD
    subgraph Frontend
        A[LoginPage] -->|POST /clientes/login| B[API Backend]
        D[UserDashboard] -->|GET /clientes/{id}/creditos| B
        D -->|POST /transacciones/registrar| B
    end
    subgraph Backend
        B --> C[DB: Clientes, Creditos, Items, Transacciones, Admin]
        B --> E[API Productos Externos]
    end
```

---

## Créditos

Proyecto realizado para HackMTY 2025 por el equipo Banorte Verde.

---
