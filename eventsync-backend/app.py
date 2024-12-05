from flask import Flask
import mysql.connector
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

@app.route('/get_events/')
def get_events():

    # Returning an api for showing in  reactjs
    return {
        "events": [
        {
            "eventName": "Event 3",
            "attendees": 5
        },
        {
            "eventName": "Event 4",
            "attendees": 6
        },
    ]
        }