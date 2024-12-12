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

@app.route('/get_users/')
def get_users():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        SELECT id, fname, lname 
                        FROM User
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_friends/')
def get_friends():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        SELECT u.fname, u.lname, u.bio
                        FROM User u
                        WHERE u.id IN (
                            SELECT user2ID 
                            FROM UserToUser 
                            WHERE user1ID = 5
                            AND isFriend = true
                            UNION
                            SELECT user1ID 
                            FROM UserToUser 
                            WHERE user2ID = 5
                            AND isFriend = true
                        );
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/delete_one_event/<int:eventId>/', methods=['DELETE'])
def delete_one_event(eventId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM EventToUser WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM Event WHERE id = %s", (eventId,))
        conn.commit()

        if mycursor.rowcount == 0:
            return jsonify({"Message":"Event not found"}), 404
        else:
            return jsonify({"Message":"Event deleted successfully"}), 200
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}


@app.route('/delete_one_event/<int:userId>/', methods=['DELETE'])
def delete_user(userId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("DELETE FROM UserToTag WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM GroupOfUserToUser WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM ChatToUser WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM EventToUser WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM UserToNotification WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM Report WHERE reportedBy = %s", (userId,))
        mycursor.execute("DELETE FROM Report WHERE reportedUserId = %s", (userId,))
        mycursor.execute("DELETE FROM Message WHERE senderId = %s", (userId,))
        mycursor.execute("DELETE FROM Item WHERE creatorId = %s", (userId,))
        mycursor.execute("DELETE FROM Tag WHERE userId = %s", (userId,))
        mycursor.execute("DELETE FROM EventInfo WHERE creatorId = %s", (userId,))
        mycursor.execute("DELETE FROM UserToUser WHERE creatorId = %s", (userId,))
        mycursor.execute("DELETE FROM User WHERE userId = %s", (userId,))
        conn.commit()

        if mycursor.rowcount == 0:
            return jsonify({"Message":"Event not found"}), 404
        else:
            return jsonify({"Message":"Event deleted successfully"}), 200
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/delete_multiple_events/<int:eventInfoId>/', methods=['DELETE'])
def delete_mult_event(eventInfoId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        DELETE FROM Event
                        WHERE eventInfoId = {eventInfoId};
                     """)
        response = mycursor.fetchall()
        conn.commit()
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
                        VALUES (1, 0, "{data["title"]}", "", "{data["locationName"]}", "", 10, True, False, 0, "{dateStr}");
                     """
        insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated)
                        VALUES (last_insert_id(), "2024-12-10 14:00:00", "2024-12-10 18:00:00", "{dateStr}");"""
        tags = data["tags"]
        for tag in tags:
            updateTag = f"""
                            UPDATE Tag
                            SET numTimesUsed = numTimesUsed + 1
                            WHERE name="{tag}"
                        """
            mycursor.execute(updateTag)
        mycursor.execute(insertEventInfo)
        mycursor.execute(insertEvent)
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return data, 201
