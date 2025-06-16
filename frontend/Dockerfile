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

# Собираем проект Next.js
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем Next.js в продакшн-режиме
CMD ["npm", "start"]