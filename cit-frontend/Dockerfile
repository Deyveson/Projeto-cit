FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código da aplicação
COPY . .

# Expõe a porta 5173
EXPOSE 5173

# Comando para executar em modo desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
