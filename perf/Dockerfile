# Usa una imagen base de Node.js
FROM node:22

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia el package.json y el package-lock.json
COPY package*.json ./

# Instala las dependencias (incluyendo Artillery)
RUN npm install

# Copia el resto de los archivos (incluyendo root.yaml y el script)
COPY . .

# Da permisos de ejecución al script de shell
RUN chmod u+x ./run-scenario.sh