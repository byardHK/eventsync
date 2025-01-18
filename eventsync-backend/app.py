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
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.views, Event.id
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
                        SELECT u.fname, u.lname, u.bio, u.email
                        FROM User u
                        WHERE u.id != 5 AND u.id NOT IN (
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

@app.route('/get_friends/')
def get_friends():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        SELECT u.fname, u.lname, u.bio, u.email
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

@app.route('/add_friend/<string:friendEmail>/')
def add_friend(friendEmail):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
                INSERT INTO UserToUser(user1Id, user2Id, isFriend)
                SELECT 5, id, TRUE
                FROM User
                WHERE email = '{friendEmail}';
                """
        mycursor.execute(query)
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

# @app.route('/add_custom_tag/<string:customTag>')
# def add_custom_tag(customTag):
#     try:  
#         conn = mysql.connector.connect(**db_config)
#         mycursor = conn.cursor()
#         query = f"""
#                 INSERT INTO UserToUser(user1Id, user2Id, isFriend)
#                 SELECT 5, id, TRUE
#                 FROM User
#                 WHERE email = '{customTag}';
#                 """
#         mycursor.execute(query)
#         conn.commit()
#     except mysql.connector.Error as err:
#         print(f"Error: {err}")
#     return {}

@app.route('/get_tags/')
def get_tags():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("SELECT Tag.id, Tag.name FROM Tag")
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/remove_friend/<string:friendEmail>/', methods=['DELETE'])
def remove_friend(friendEmail):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
                DELETE FROM UserToUser
                WHERE (user1Id = 5 AND user2Id = (SELECT id FROM User WHERE email = '{friendEmail}'))
                OR (user1Id = (SELECT id FROM User WHERE email = '{friendEmail}') AND user2Id = 5);
                """
        mycursor.execute(query)
        conn.commit()
        if mycursor.rowcount == 0:
            return jsonify({"Message":"Friend not found"}), 404
        else:
            return jsonify({"Message":"Friend removed successfully"}), 200
        
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
        mycursor.execute
        conn.commit()

        if mycursor.rowcount == 0:
            return jsonify({"Message":"Event not found"}), 404
        else:
            return jsonify({"Message":"Event deleted successfully"}), 200
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}


@app.route('/delete_user/<int:userId>/', methods=['DELETE'])
def delete_user(userId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("DELETE FROM User WHERE id = %s", (userId,))
        conn.commit()

        if mycursor.rowcount == 0:
            return jsonify({"Message":"User not found"}), 404
        else:
            return jsonify({"Message":"User deleted successfully"}), 200
        
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

# Returns the response of a SQL query as a list
def sqlResponseToList(response, headers):
    fields = [x[0] for x in headers]
    arr = []
    for result in response:
        arr.append(dict(zip(fields,result)))
    return arr

# Returns the response of a SQL query as a JSON response object
def sqlResponseToJson(response, headers):
    return jsonify(sqlResponseToList(response, headers))

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
        currentDateTime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        startDateTime = data["startDateTime"]
        endDateTime = data["endDateTime"]


        db_startDateTime = datetime.strptime(startDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')
        db_endDateTime = datetime.strptime(endDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')
       
        insertEventInfo = f"""
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated)
                        VALUES (1, 0, "{data["title"]}", "", "{data["locationName"]}", "", 10, True, False, 0, "{currentDateTime}");
                     """
        insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views)
                        VALUES (last_insert_id(), "{db_startDateTime}", "{db_endDateTime}", "{currentDateTime}", "0");"""
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

# for each event return: name, location, date/time, (views/rsvps), viewing link
@app.route('/get_my_events/<int:user_id>')
def get_my_events(user_id: int):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName
                        FROM Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                        WHERE EventInfo.creatorId = {user_id}
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        hosting_events = sqlResponseToList(response, headers)
        mycursor.execute(f"""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName
                        FROM Event
                        JOIN EventInfo
                        ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id IN (SELECT EventToUser.eventId FROM EventToUser WHERE EventToUser.userId = {user_id})
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        attending_events = sqlResponseToList(response, headers)
        return jsonify({"hosting": hosting_events, "attending": attending_events})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}
