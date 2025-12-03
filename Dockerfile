# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variable with default fallback
ARG REACT_APP_API_URL=https://madestone-backend-production.up.railway.app
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Debug: Show what API URL is being used
RUN echo "Building with API URL: $REACT_APP_API_URL"

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Railway sets PORT env variable, default to 5001 to match Railway public port
ENV PORT=5001

# Expose the port
EXPOSE $PORT

# Start nginx with envsubst to replace PORT variable
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
