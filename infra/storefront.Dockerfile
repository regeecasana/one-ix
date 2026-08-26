# Dev-only image for apps/storefront -- used by infra/docker-compose.yml for
# local development. NOT used for the hosted deployment: Vercel builds
# apps/storefront directly from source (see docs/hosting.md).
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/zendesk-app/package.json apps/zendesk-app/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace=apps/storefront"]
