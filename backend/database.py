import pyodbc


# ============================================================
# YAMAN MOTORS - SQL SERVER DATABASE CONNECTION
# ============================================================

SERVER = "yaman-motors-rds.cz624mg2cdrc.ap-south-1.rds.amazonaws.com"
PORT = 1433
DATABASE = "YamanMotorsDB"

USERNAME = "admin"

# Replace this with your actual RDS master password.
PASSWORD = "YmRds#2026!M0tors$81"


DRIVER = "ODBC Driver 18 for SQL Server"


def get_connection():
    """
    Create and return a connection to YamanMotorsDB.
    """

    connection_string = (
        f"DRIVER={{{DRIVER}}};"
        f"SERVER={SERVER},{PORT};"
        f"DATABASE={DATABASE};"
        f"UID={USERNAME};"
        f"PWD={PASSWORD};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=10;"
    )

    return pyodbc.connect(connection_string)


def test_connection():
    """
    Test the SQL Server connection.
    """

    connection = None

    try:
        connection = get_connection()

        cursor = connection.cursor()
        cursor.execute("SELECT DB_NAME()")

        database_name = cursor.fetchone()[0]

        print("====================================")
        print("YAMAN MOTORS DATABASE CONNECTION")
        print("====================================")
        print("Status   : Connected")
        print(f"Database : {database_name}")
        print("Server   : SQL Server RDS")
        print("====================================")

    except Exception as error:
        print("====================================")
        print("DATABASE CONNECTION FAILED")
        print("====================================")
        print(error)
        print("====================================")

    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    test_connection()
