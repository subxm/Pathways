package com.pathways.userservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

@SpringBootApplication
public class UserServiceApplication {

    public static void main(String[] args) {
        initializeDatabaseSchemas();
        SpringApplication.run(UserServiceApplication.class, args);
    }

    private static void initializeDatabaseSchemas() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null) {
            // Neon connection string in JDBC format
            dbUrl = "jdbc:postgresql://ep-fancy-grass-ahyz5733-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&user=neondb_owner&password=npg_XnF2PjEwU5GT";
        } else if (dbUrl.startsWith("postgresql://")) {
            // Convert postgresql:// to jdbc:postgresql:// if needed
            dbUrl = "jdbc:" + dbUrl;
        }

        System.out.println("Initializing database schemas using: " + dbUrl.replaceAll("password=[^&]*", "password=****"));
        
        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(dbUrl)) {
                try (Statement stmt = conn.createStatement()) {
                    System.out.println("Creating user_schema...");
                    stmt.execute("CREATE SCHEMA IF NOT EXISTS user_schema;");
                    System.out.println("Creating path_schema...");
                    stmt.execute("CREATE SCHEMA IF NOT EXISTS path_schema;");
                    System.out.println("Creating chat_schema...");
                    stmt.execute("CREATE SCHEMA IF NOT EXISTS chat_schema;");
                    System.out.println("All schemas initialized successfully.");
                }
            }
        } catch (ClassNotFoundException e) {
            System.err.println("PostgreSQL driver not found: " + e.getMessage());
        } catch (SQLException e) {
            System.err.println("Database schema initialization failed: " + e.getMessage());
        }
    }
}
