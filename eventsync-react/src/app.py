import mysql.connector

# Replace with your actual details
db_config = {
    'host': '10.18.101.62',  # VM's public IP
    'port': 3306,
    'user': 'jminnich1',
    'password': 'EventSync1!@',
    'database': 'event_sync'
}

try:
    conn = mysql.connector.connect(**db_config)
    print("Connection successful!")
except mysql.connector.Error as err:
    print(f"Error: {err}")