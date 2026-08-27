# Dev-only image for apps/api -- used by infra/docker-compose.yml for local
# development. NOT used for the hosted deployment: Render builds apps/api
# directly from source via ../render.yaml (see docs/hosting.md).
FROM node:20-alpine

# Prisma's query engine needs OpenSSL, which the alpine base image doesn't
# ship by default -- without this, `prisma generate`/`db push` fail with an
# opaque "Could not parse schema engine response" error.
RUN apk add --no-cache openssl

WORKDIR /app

# Copy just the workspace manifests first so `npm install` is cached across
# rebuilds unless a package.json actually changed. Source is bind-mounted
# at runtime by docker-compose, so the COPY . . below only matters for
# `docker build` / `docker run` used standalone, without compose.
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/zendesk-app/package.json apps/zendesk-app/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev", "--workspace=apps/api"]
