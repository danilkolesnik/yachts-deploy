# Build stage
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Собираем приложение
RUN npm run build

# Production stage
FROM node:20-alpine

# Устанавливаем необходимые зависимости для Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Устанавливаем рабочую директорию
WORKDIR /app

# Создаем директории для загрузки файлов
RUN mkdir -p /app/uploads/video /app/uploads/image /app/uploads/logo && \
    chmod -R 777 /app/uploads

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm install --only=production

# Копируем собранное приложение из builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

COPY src/database/init.sql /docker-entrypoint-initdb.d/

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["npm", "run", "start:prod"]
