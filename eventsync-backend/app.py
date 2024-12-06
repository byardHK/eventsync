from flask import Flask, request, jsonify
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
    mycursor = conn.cursor()
except mysql.connector.Error as err:
    print(f"Error: {err}")

@app.route('/get_events/')
def get_events():
    mycursor.execute("""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName
                        from Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                     """)
    return sqlResponseToJson(mycursor.fetchall())

# Returns the response of a SQL query as a JSON
def sqlResponseToJson(response):
    fields = [x[0] for x in mycursor.description]
    arr = []
    for result in response:
        arr.append(dict(zip(fields,result)))
    return jsonify(arr)