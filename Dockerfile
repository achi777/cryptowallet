# syntax=docker/dockerfile:1.6

# ------- Stage 1: build frontend -------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json frontend/.npmrc* ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY frontend/ ./
RUN npm run build
# CRA output: /app/frontend/build/

# ------- Stage 2: build backend -------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
# Bundle the SPA into Spring Boot's static resources so the fat JAR serves it directly.
COPY --from=frontend-build /app/frontend/build/ ./src/main/resources/static/
RUN mvn -B -q -DskipTests package
# Spring Boot maven plugin produces target/crypto-wallet-backend-<version>.jar (fat JAR)
# and target/<name>.jar.original (plain JAR — won't match the *.jar glob below).

# ------- Stage 3: runtime -------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar /app/app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=staging
# Spring Boot Actuator exposes /actuator/health (status only, never details).
# Boot can take ~25s on cold start; first 30s is the start period.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java","-jar","/app/app.jar"]
