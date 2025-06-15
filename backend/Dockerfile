# Используем официальный образ Node.js
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

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .
RUN npm run build

COPY src/database/init.sql /docker-entrypoint-initdb.d/

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["npm", "run", "start:prod"]
