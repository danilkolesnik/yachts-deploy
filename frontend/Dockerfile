FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

# Baked into the Next.js client bundle at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
