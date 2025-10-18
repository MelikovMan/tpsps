# Stage 1: Build
FROM node:alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.template
ENV PORT=8080
CMD sh -c "envsubst \"`env | awk -F = '{printf \" \\\\$%s\", $1}'`\" < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
