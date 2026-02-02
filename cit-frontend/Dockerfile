FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código da aplicação
COPY . .

# Build para produção
RUN npm run build

# Estágio de produção com servidor estático
FROM node:20-alpine

WORKDIR /app

# Instala serve para servir arquivos estáticos
RUN npm install -g serve

# Copia arquivos buildados
COPY --from=builder /app/dist ./dist

# Copia configuração do serve para SPA
COPY --from=builder /app/serve.json ./dist/serve.json

# Railway usa variável PORT
EXPOSE 5173

# Serve os arquivos estáticos (com config para SPA)
CMD ["sh", "-c", "serve dist -l ${PORT:-5173}"]
