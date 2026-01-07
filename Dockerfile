# Use the official Bun image
FROM oven/bun:1 AS build
WORKDIR /app

# Install build tools for native modules (bcrypt)
USER root
RUN apt-get update && apt-get install -y python3 make g++

# Install dependencies
# Copy package.json and bun.lock to cache dependencies
COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
# We accept NODE_COMMIT as a build argument to pass the git hash
ARG NODE_COMMIT_TEAPOT=unknown
ENV NODE_COMMIT_TEAPOT=${NODE_COMMIT_TEAPOT}

ENV NODE_ENV=production

# Run the build script
# Using nitro build directly to avoid git dependency in package.json script
RUN bun --bun nitro build

# Use oven/bun:1 (Debian) for production to match the build environment (glibc)
# and ensure native modules work correctly.
FROM oven/bun:1 AS production
WORKDIR /app

# Set environment variables
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NODE_ENV=production

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output /app

# For bun
ENV NODE_PATH=/app/server/node_modules

# run the app
EXPOSE 3000
ENTRYPOINT [ "bun", "--bun", "run", "server/index.mjs" ]