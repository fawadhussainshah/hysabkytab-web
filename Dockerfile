# Runtime image only. The app is built on the Mac (`npm run build` with output: standalone) because
# `next build` needs more RAM than the shared t3.medium can spare. See deploy/hysab-deploy.sh.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
