package com.greenanimalsbank;
import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    public static Connection getConnection(){
        Connection connection = null;

        String DBDriver = "com.mysql.jdbc.Driver";
        String url = "jdbc:mysql://mysql.greenanimalsbank.com:3306";
        String username = "dbadmin";
        String password = "Green_456!";

        try{
            Class.forName(DBDriver);
            connection = DriverManager.getConnection(url, username, password);
        }catch (Exception e){
            e.printStackTrace();
        }
        return connection;
    }
}
