# Используем официальный образ Node.js
FROM node:18

# Устанавливаем необходимые зависимости для Puppeteer
RUN apt-get update && apt-get install -y \
    apparmor \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libx11-xcb1 \
    libxcb1 \
    libxshmfence1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Создаем директории для загрузки файлов
RUN mkdir -p /app/uploads/image /app/uploads/video /app/uploads/logo && \
    chmod -R 777 /app/uploads

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .
RUN npm run build

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["npm", "run", "start"]