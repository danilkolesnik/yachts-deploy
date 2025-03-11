# Используем официальный образ Node.js
FROM node:18
RUN apt-get update && apt-get install -y apparmor
# Устанавливаем рабочую директорию
WORKDIR /app

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
