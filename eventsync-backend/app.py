# INSTALL THESE:
# pip install mysql-connector-python

import mysql.connector

db_config = {
    'host': '10.18.101.62',  
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