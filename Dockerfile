# ============================
# SSSP Web (Dev) - Vite :5173
# ============================
FROM node:20-alpine

WORKDIR /app

# install deps first (better cache)
COPY apps/web/package*.json ./
RUN npm install

# copy source
COPY apps/web/ ./

# file watching inside Docker (Windows/Mac friendly)
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
