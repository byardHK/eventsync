from flask import Flask, request, jsonify, Response
from flask import Flask, request, jsonify
# INSTALL THESE:
# pip install mysql-connector-python
import mysql.connector
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

db_config = {
    'host': '10.18.101.62',  
    'port': 3306,
    'user': 'jminnich1',
    'password': 'EventSync1!@',
    'database': 'event_sync'
}

@app.route('/get_events/')
def get_events():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName
                        from Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

# Returns the response of a SQL query as a JSON
def sqlResponseToJson(response, headers):
    fields = [x[0] for x in headers]
    arr = []
    for result in response:
        arr.append(dict(zip(fields,result)))
    return jsonify(arr)

@app.route('/post_event/')
def getpost_event():
    return "You should not be here..."

@app.before_request
def basic_authentication():
    if request.method.lower() == 'options':
        return Response()

@app.post('/post_event/')
def post_event():
    data = request.json
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        dateStr = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        insertEventInfo = f"""
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated)
                        VALUES ("harnlyam20@gcc.edu", 0, "{data["title"]}", "", "{data["locationName"]}", "", 10, True, False, 0, "{dateStr}");
                     """
        insertEvent = """INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated)
                        VALUES (last_insert_id(), "2024-12-10 14:00:00", "2024-12-10 18:00:00", "{dateStr}");"""
        mycursor.execute(insertEventInfo)
        mycursor.execute(insertEvent)
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return data, 201
