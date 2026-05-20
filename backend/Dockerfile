# syntax=docker/dockerfile:1.7

# ---------- build (imagen con Maven; evita apt-get install maven en Cloud Shell) ----------
FROM docker.io/library/maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package \
 && cp target/*.jar /workspace/app.jar

# ---------- runtime ----------
FROM docker.io/library/eclipse-temurin:17-jre
WORKDIR /app
RUN useradd -m -u 1001 spring && mkdir -p /data/project-card-covers && chown -R spring:spring /data
USER spring
COPY --from=build --chown=spring:spring /workspace/app.jar /app/app.jar
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom" \
    SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
