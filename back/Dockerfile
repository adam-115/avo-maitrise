# Use Eclipse Temurin JRE 17 on Ubuntu (Jammy) for running the application
FROM eclipse-temurin:17-jre-jammy

# Set working directory inside the container
WORKDIR /app

# Copy the pre-built Spring Boot executable JAR
COPY target/back-0.0.1-SNAPSHOT.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod" ,"app.jar"]
