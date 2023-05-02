FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV TELEGRAM_TOKEN=${TELEGRAM_TOKEN}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV PORT=${PORT}

EXPOSE $PORT

CMD ["sh", "-c", "PORT=${PORT:-3000} npm start"]
