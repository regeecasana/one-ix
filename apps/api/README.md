# @oneix/api

Backend for the oneix demo. Owns the data model and every side effect
(email, Zendesk API calls, background jobs). See:

- [../../docs/architecture.md](../../docs/architecture.md)
- [../../docs/data-model.md](../../docs/data-model.md)
- [../../docs/api-spec.md](../../docs/api-spec.md)
- [../../docs/demo-setup.md](../../docs/demo-setup.md)

Status: scaffolded, not yet implemented (see [../../docs/roadmap.md](../../docs/roadmap.md)).

```
cp .env.example .env
npm run prisma:migrate
npm run seed
npm run dev
```
