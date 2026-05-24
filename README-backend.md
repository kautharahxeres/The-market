# Backend (Node.js + MySQL)

Quick setup:

1. Copy `.env.example` to `.env` and fill values.
2. Create the database and tables by running `sql/schema.sql` in your MySQL server.
3. Install dependencies and start the server:

```bash
npm install
npm run dev
```

Endpoints:

- `POST /api/register` — register (body: `name`, `email`, `password`)
- `POST /api/login` — login (body: `email`, `password`)
- `GET /api/products` — list products
- `GET /api/products/:id` — get product
- `POST /api/products` — create product (requires `Authorization: Bearer <token>`)
- `PUT /api/products/:id` — update product (requires `Authorization: Bearer <token>`)
- `DELETE /api/products/:id` — delete product (requires `Authorization: Bearer <token>`)

Note: You must create the database and tables before starting the server by running `sql/schema.sql` in your MySQL server.
