FROM node:18

# Crear el directorio de trabajo
RUN mkdir -p /opt/app

# Establecer el directorio de trabajo
WORKDIR /opt/app

# Copiar el directorio utils
COPY ./utils ./utils

# Copiar los archivos necesarios
COPY app.js package.json package-lock.json ./

# Instalar las dependencias
RUN npm install

# Definir el punto de entrada
ENTRYPOINT [ "node", "app.js" ]