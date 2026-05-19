# syntax=docker/dockerfile:1.7

# ---------- build ----------
FROM docker.io/library/eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# Cache de dependencias
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    if [ -f mvnw ]; then chmod +x mvnw; ./mvnw -B -q dependency:go-offline; \
    else apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/* \
      && mvn -B -q -DskipTests dependency:go-offline; fi

# Build
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    if [ -f mvnw ]; then ./mvnw -B -q -DskipTests package; \
    else mvn -B -q -DskipTests package; fi \
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
