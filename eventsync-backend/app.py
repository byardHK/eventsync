from flask import Flask, request, jsonify, Response
# INSTALL THESE:
# pip install mysql-connector-python
import mysql.connector
from flask_cors import CORS
from datetime import datetime, timedelta
from dateutil.relativedelta import *

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
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.views, Event.id, (
                            SELECT COUNT(*) FROM Event WHERE Event.eventInfoId = EventInfo.id ) AS recurs
                        from Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        mycursor.close()
        conn.close()
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
        mycursor.close()
        conn.close()
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/create_custom_tag/')
def add_custom_tag():
    body = request.json
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
                INSERT INTO Tag (name, numTimesUsed, userId) VALUES ("{body["name"]}", 0, "{body["userId"]}");
                """
        mycursor.execute(query)
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/delete_custom_tag/<int:tagId>/', methods=['DELETE'])
def delete_custom_tag(tagId):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("DELETE FROM Tag WHERE id = %s;", (tagId,))
        conn.commit()
        rowCount: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if rowCount == 0:
            return jsonify({"Message":"Tag not found"}), 404
        else:
            return jsonify({"Message":"Tag deleted successfully"}), 200
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/save_user_selected_tags/')
def save_user_selected_tags():
    body = request.json
    userId = body["userId"]
    values: str = ""

    selectedTags = body["selectedTags"];
    if len(selectedTags) == 0:
        return {}

    for tag in selectedTags:
        values += f'("{userId}", {tag["id"]}), '

    #Remove extra comma and space afterwards
    values = values[:-2]

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            INSERT INTO UserToTag (userId, tagId)
            VALUES {values};
        """
        mycursor.execute(query)
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Save Selected Tags Error: {err}")
    return {}

@app.post('/delete_user_deselected_tags/')
def delete_user_deselected_tags():
    body = request.json
    userId = body["userId"]
    deselectedTags = body["deselectedTags"]

    #If we did not delete anything, there's no need to run the deletion query.
    if len(deselectedTags) == 0:
        return {}

    values: str = ""
    for tag in deselectedTags:
        values += f'("{userId}", {tag["id"]}), '
    values = values[:-2]
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            DELETE FROM UserToTag WHERE (userId, tagId) IN ({values});
        """
        mycursor.execute(query)
        conn.commit()
        rowcount: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if rowcount == 0:
            return jsonify({"Message":"Tags not found"})
        else:
            return jsonify({"Message":"Tags deleted successfully"})
    except mysql.connector.Error as err:
        print(f"Delete User Deselected Tags Error: {err}")
    return {}

# Here
@app.post('/save_event_selected_tags/')
def save_event_selected_tags():
    body = request.json
    eventInfoId = body["eventInfoId"]
    values: str = ""

    for tag in body["selectedTags"]:
        values += f'({eventInfoId}, {tag["id"]}), '

    #Remove extra comma and space afterwards
    values = values[:-2]

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            INSERT INTO EventInfoToTag (eventInfoId, tagId)
            VALUES {values};
        """
        mycursor.execute(query)
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Save Selected Tags Error: {err}")
    return {}

@app.post('/delete_event_deselected_tags/')
def delete_event_deselected_tags():
    body = request.json
    eventInfoId = body["eventInfoId"]
    deselectedTags = body["deselectedTags"]

    #If we did not delete anything, there's no need to run the deletion query.
    if len(deselectedTags) == 0:
        return {}

    values: str = ""
    for tag in deselectedTags:
        values += f'({eventInfoId}, {tag["id"]}), '
    values = values[:-2]
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            DELETE FROM EventInfoToTag WHERE (eventInfoId, tagId) IN ({values});
        """
        mycursor.execute(query)
        conn.commit()

        rowcount: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if rowcount == 0:
            return jsonify({"Message":"Tags not found"})
        else:
            return jsonify({"Message":"Tags deleted successfully"})
    except mysql.connector.Error as err:
        print(f"Delete User Deselected Tags Error: {err}")
    return {}


@app.route('/get_tags/')
def get_tags():
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("SELECT Tag.id, Tag.name, Tag.userId FROM Tag")
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        mycursor.close()
        conn.close()
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_user_tags/<string:userId>/')
def get_user_tags(userId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            SELECT Tag.id, Tag.name, Tag.userId FROM Tag INNER JOIN (
                SELECT UserToTag.tagId FROM UserToTag WHERE UserToTag.userId = "{userId}"
            ) AS UserToTag ON Tag.id = UserToTag.tagId;
        """
        mycursor.execute(query)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        mycursor.close()
        conn.close()
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_event_tags/<int:eventInfoId>/')
def get_event_tags(eventInfoId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = f"""
            SELECT Tag.id, Tag.name, Tag.userId FROM Tag INNER JOIN (
                SELECT EventInfoToTag.tagId FROM EventInfoToTag WHERE EventInfoToTag.eventInfoId = {eventInfoId}
            ) AS EventInfoToTag ON Tag.id = EventInfoToTag.tagId;
        """
        mycursor.execute(query)
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        mycursor.close()
        conn.close()
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
        mycursor.close()
        conn.close()
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
        mycursor.close()
        conn.close()
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
        mycursor.close()
        conn.close()
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
        rowCount: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if rowCount == 0:
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
        rowCount: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if rowCount == 0:
            return jsonify({"Message":"User not found"}), 404
        else:
            return jsonify({"Message":"User deleted successfully"}), 200
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/delete_multiple_events/<int:eventId>/', methods=['DELETE'])
def delete_mult_event(eventId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SET @eventInfoId = (SELECT eventInfoId FROM Event WHERE id = {eventId});
                        
                     """)
        mycursor.execute("""DELETE FROM Event
                        WHERE eventInfoId = @eventInfoId;""")
        conn.commit()

        success: int = mycursor.rowcount
        mycursor.close()
        conn.close()

        if success == 0:
            return jsonify({"Message":"Event not found"}), 404
        else:
            return jsonify({"Message":"Event deleted successfully"}), 200

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}


@app.route('/addOneView/<int:eventId>/', methods=['POST'])
def addOneView(eventId):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
            UPDATE Event
            SET views = views + 1
            WHERE id = %s
        """, (eventId,))
        conn.commit()
        success: int = mycursor.rowcount
        mycursor.close()
        conn.close()
        if success == 0:
            return jsonify({"message": "Event not found or no changes made"}), 404
        return jsonify({"message": "View count updated successfully"}), 200
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database error"}), 500
    finally:
        if 'mycursor' in locals() and mycursor:
            mycursor.close()
        if 'conn' in locals() and conn:
            conn.close()

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
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo)
                        VALUES ("{data["creatorId"]}", 0, "{data["title"]}", "{data["description"]}", "{data["locationName"]}", "", {data["rsvpLimit"]}, {data["isPublic"]}, {data["isWeatherSensitive"]}, 0, "{currentDateTime}", "{data["venmo"]}");
                     """
        insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views)
                        VALUES (last_insert_id(), "{db_startDateTime}", "{db_endDateTime}", "{currentDateTime}", "0");"""
        tags = data["tags"]
        for tag in tags:
            updateTag = f"""
                            UPDATE Tag
                            SET numTimesUsed = numTimesUsed + 1
                            WHERE name="{tag["name"]}"
                        """
            mycursor.execute(updateTag)
        mycursor.execute(insertEventInfo)
        eventInfoId = mycursor.lastrowid
        mycursor.execute(insertEvent)
        mycursor.execute("SET @eventId = last_insert_id();")

        for item in data["items"]:
            insertItem = f"""
                            INSERT INTO Item (name, creatorId)
                            VALUES ("{item["description"]}", "minnichjs21@gcc.edu"); 
                        """ # TODO: change creator
            insertEventToItem = f"""
                            INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                            VALUES (@eventId, LAST_INSERT_ID(), "{item["amountNeeded"]}", 0);
                        """
            mycursor.execute(insertItem)
            mycursor.execute(insertEventToItem)

        for tag in tags:
            updateTag = f"""
                            INSERT INTO EventInfoToTag(eventInfoId, tagId)
                            VALUES ({eventInfoId} , {tag["id"]});
                        """
            print(updateTag)
            mycursor.execute(updateTag)
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return data, 201

# for each event return: name, location, date/time, (views/rsvps), viewing link
@app.route('/get_my_events/<string:user_id>')
def get_my_events(user_id: str):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName, (
                            SELECT COUNT(*) FROM Event WHERE Event.eventInfoId = EventInfo.id ) AS recurs
                        FROM Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                        WHERE EventInfo.creatorId = '{user_id}'
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        hosting_events = sqlResponseToList(response, headers)
        mycursor.execute(f"""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName
                        FROM Event
                        JOIN EventInfo
                        ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id IN (SELECT EventToUser.eventId FROM EventToUser WHERE EventToUser.userId = '{user_id}')
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        attending_events = sqlResponseToList(response, headers)
        mycursor.close()
        conn.close()
        return jsonify({"hosting": hosting_events, "attending": attending_events})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}


@app.post('/post_recurring_event')
def post_recurring_event():
    data = request.json
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        reqStrFormat = '%Y-%m-%dT%H:%M:%S.%fZ'
        dateCreated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        insertEventInfo = f"""
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo)
                        VALUES ("{data["creatorId"]}", 0, "{data["title"]}", "{data["description"]}", "{data["locationName"]}", "", 10, True, False, 0, "{dateCreated}", "{data["venmo"]}");
                     """
        mycursor.execute(insertEventInfo)
        eventInfoId = mycursor.lastrowid
        mycursor.execute("SET @eventInfoId = last_insert_id();")
        tags = data["tags"]
        for tag in tags:
                updateTag = f"""
                                INSERT INTO EventInfoToTag(eventInfoId, tagId)
                                VALUES ({eventInfoId} , {tag["id"]});
                            """
                print(updateTag)
                mycursor.execute(updateTag)
        # get event dates through start date and end date
        curStartDate = datetime.strptime(data["startDateTime"], reqStrFormat)
        curEndDate = datetime.strptime(data["endDateTime"], reqStrFormat)
        endDate = datetime.strptime(data["endRecurDateTime"], reqStrFormat)
        delta = data["recurFrequency"]
        duration = curEndDate - curStartDate
        if delta == "Monthly":
            weekdays = [MO, TU, WE, TH, FR, SA, SU]
            dayOfWeek = weekdays[curStartDate.weekday()] # day of the week of event
            nthWeekday = (curStartDate.day // 7) + 1 # what number ___day of the month is this event on?
        
        itemIds = []

        for item in data["items"]:
            insertItem = f"""
                            INSERT INTO Item (name, creatorId)
                            VALUES ("{item["description"]}", "minnichjs21@gcc.edu"); 
                        """ # TODO: change creator
            getItemId = "SELECT LAST_INSERT_ID();"
            mycursor.execute(insertItem)
            mycursor.execute(getItemId)
            itemIds.append((mycursor.fetchone()[0], item))


        while curStartDate <= endDate:
            insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated)
                        VALUES (@eventInfoId, "{curStartDate.strftime("%Y-%m-%d %H:%M:%S")}", "{curEndDate.strftime("%Y-%m-%d %H:%M:%S")}", "{dateCreated}");"""
            mycursor.execute(insertEvent)
            mycursor.execute("SET @eventId = last_insert_id();")
            for el in itemIds:
                insertItem = f"""
                                INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                                VALUES (@eventId, {el[0]}, {el[1]["amountNeeded"]}, 0);
                            """
                mycursor.execute(insertItem)
                
            if delta == "Daily":
                curStartDate = curStartDate + timedelta(days=1)
            elif delta == "Weekly":
                curStartDate = curStartDate + timedelta(weeks=1)
            elif delta == "Monthly":
                curStartDate = (curStartDate + relativedelta(months=1)).replace(day=1) # first day of the next month
                curStartDate = curStartDate + relativedelta(weekday=dayOfWeek(nthWeekday)) # next event date
            else:
                return "Invalid recurring frequency", 400
            curEndDate = curStartDate + duration
            for tag in tags:
                updateTag = f"""
                                UPDATE Tag
                                SET numTimesUsed = numTimesUsed + 1
                                WHERE name="{tag["name"]}"
                            """
                mycursor.execute(updateTag)
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return data, 201

@app.route('/get_event/<int:event_id>/<string:user_id>', methods=['GET'])
def get_event(event_id: int, user_id: int):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SELECT 
                        Event.id, 
                        Event.eventInfoId,
                        EventInfo.creatorId, 
                        EventInfo.groupId, 
                        EventInfo.title, 
                        EventInfo.description, 
                        EventInfo.locationName, 
                        EventInfo.locationLink,
                        EventInfo.venmo, 
                        EventInfo.RSVPLimit, 
                        EventInfo.isPublic, 
                        EventInfo.isWeatherDependant, 
                        EventInfo.numTimesReported, 
                        Event.startTime, 
                        Event.endTime
                        FROM Event
                        JOIN EventInfo ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id = {event_id}
                     """)
        response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        event = dict(zip(headers, response[0]))

        mycursor.execute(f"""
                        SELECT Tag.id, Tag.name, Tag.userId
                        FROM Tag
                        JOIN EventInfoToTag ON Tag.id = EventInfoToTag.tagId
                        WHERE EventInfoToTag.eventInfoId = {event['eventInfoId']}
                     """)
        tags_response = mycursor.fetchall()
        tags = [{
            "id": tag[0],
            "name": tag[1],
            "userId": tag[2]
        } for tag in tags_response]
        event['tags'] = tags

        mycursor.execute(f"""
                        SELECT Item.name, EventToItem.amountNeeded, EventToItem.quantitySignedUpFor, COALESCE(UserToItem.quantity, 0), Item.id 
                        FROM Item
                        JOIN EventToItem ON Item.id = EventToItem.itemId
                        LEFT OUTER JOIN (SELECT * FROM UserToItem 
                                        WHERE (userId, eventId) = ('{user_id}', {event_id})) 
                            AS UserToItem ON Item.id = UserToItem.itemId
                        WHERE EventToItem.eventId = {event_id}
                     """)
        items_response = mycursor.fetchall()
        items = [{'name': item[0], 'amountNeeded': item[1], 'othersQuantitySignedUpFor': item[2] - item[3], 'myQuantitySignedUpFor': item[3], 'id': item[4]} for item in items_response]
        event['items'] = items

        mycursor.execute(f"""
                        SELECT User.id, User.fname, User.lname
                        FROM User
                        JOIN EventToUser ON User.id = EventToUser.userId
                        WHERE EventToUser.eventId = {event_id}
                    """)
        users_response = mycursor.fetchall()
        users = [{'id': user[0], 'fname': user[1], 'lname': user[2]} for user in users_response]
        event['users'] = users
        mycursor.close()
        conn.close()
        return jsonify(event)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/editEvent/<int:eventId>', methods=['PUT'])
def edit_event(eventId):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
            SELECT Event.eventInfoId
            FROM Event
            JOIN EventInfo ON Event.eventInfoId = EventInfo.id
            WHERE Event.id = {eventId}
        """)
        response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        event = dict(zip(headers, response[0]))
        if not event:
            return jsonify({"error": "Event not found"}), 404

        data = request.json

        startDateTime = data["startDateTime"]
        endDateTime = data["endDateTime"]

        db_startDateTime = datetime.strptime(startDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')
        db_endDateTime = datetime.strptime(endDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')
        if data.get("editAllEvents"):
            eventInfoUpdate = f"""
                UPDATE EventInfo
                SET title = '{data["title"]}',
                    description = '{data["description"]}',
                    locationName = '{data["locationName"]}',
                    RSVPLimit = {data["rsvpLimit"]},
                    isPublic = {int(data["isPublic"])},
                    isWeatherDependant = {int(data["isWeatherSensitive"])},
                    venmo = '{data["venmo"]}'
                WHERE id = {event["eventInfoId"]}
            """
            mycursor.execute(eventInfoUpdate)
            eventInfoId = mycursor.lastrowid

            eventUpdate = f"""
                UPDATE Event
                SET startTime = '{db_startDateTime}', endTime = '{db_endDateTime}'
                WHERE id = {eventId}
            """
            mycursor.execute(eventUpdate)

            tags = data["tags"]
            if tags:
                for tag in tags:
                    updateTag = f"""
                                    UPDATE Tag
                                    SET numTimesUsed = numTimesUsed + 1
                                    WHERE name="{tag["name"]}"
                                """
                mycursor.execute(updateTag)

                for tag in tags:
                    updateTag = f"""
                                    INSERT INTO EventInfoToTag(eventInfoId, tagId)
                                    VALUES ({eventInfoId} , {tag["id"]});
                                """
                    print(updateTag)
                    mycursor.execute(updateTag)
        else:
            currentDateTime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            eventInfoInsert = f"""
                INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo)
                VALUES ('{data["creatorId"]}', 0, '{data["title"]}', '{data["description"]}', '{data["locationName"]}', '', {data["rsvpLimit"]}, {int(data["isPublic"])}, {int(data["isWeatherSensitive"])}, 0, '{currentDateTime}', '{data["venmo"]}');
            """
            mycursor.execute(eventInfoInsert)
            eventInfoId = mycursor.lastrowid
            eventUpdate = f"""
                UPDATE Event
                SET eventInfoId = {eventInfoId}, startTime = '{db_startDateTime}', endTime = '{db_endDateTime}'
                WHERE id = {eventId}
            """
            mycursor.execute(eventUpdate)

            tags = data["tags"]
            if tags:
                for tag in tags:
                    updateTag = f"""
                                    UPDATE Tag
                                    SET numTimesUsed = numTimesUsed + 1
                                    WHERE name="{tag["name"]}"
                                """
                mycursor.execute(updateTag)

                for tag in tags:
                    updateTag = f"""
                                    INSERT INTO EventInfoToTag(eventInfoId, tagId)
                                    VALUES ({eventInfoId} , {tag["id"]});
                                """
                    print(updateTag)
                    mycursor.execute(updateTag)

        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "Event updated successfully"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/edit_user_to_item/', methods=['PUT'])
def edit_user_to_item():
    try:
        data = request.json
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        if data['quantity'] == 0:
            deleteUserToitem = f"""
                    DELETE FROM UserToItem 
                    WHERE (userId, eventId, itemId) = ('{data['userId']}', {data['eventId']}, {data['itemId']})
                """
            mycursor.execute(deleteUserToitem)
        else:
            updateUserToitem = f"""
                    INSERT INTO UserToItem (userId, eventId, itemId, quantity) VALUES ('{data['userId']}', {data['eventId']}, {data['itemId']}, {data['quantity']})
                    ON DUPLICATE KEY UPDATE quantity = {data['quantity']};
                """
            mycursor.execute(updateUserToitem)
        conn.commit()
        return jsonify({"message": "Quantity signed up for was updated successfully"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}