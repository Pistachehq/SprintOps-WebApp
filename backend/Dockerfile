# Imagen de producción (OCI DevOps / OKE), alineada con la práctica MyTodoList.
# Requisito: antes, `mvn package` (el build_spec o oci/build.sh lo ejecutan).
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
EXPOSE 8080
COPY target/sprintops-backend-0.0.1-SNAPSHOT.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
