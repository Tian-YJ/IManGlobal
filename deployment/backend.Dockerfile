# syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
RUN --mount=type=cache,target=/root/.m2 mvn -B -f backend/pom.xml dependency:go-offline
COPY backend/src backend/src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -f backend/pom.xml clean package -DskipTests && \
    cp "$(find backend/target -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | head -n 1)" /workspace/app.jar

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /app app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/app.jar app.jar
USER 10001:10001
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl --fail --silent http://127.0.0.1:8080/api/v3/api-docs >/dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
