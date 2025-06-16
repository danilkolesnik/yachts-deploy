# Используем официальный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Собираем проект Next.js и проверяем результат
RUN npm run build && \
    ls -la .next/ || echo "Build failed - .next directory not created"

# Открываем порт
EXPOSE 3000

# Запускаем Next.js в продакшн-режиме
CMD ["npm", "run", "start"]