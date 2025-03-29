import jwt
import requests
from flask import Flask, request, jsonify, Response
# INSTALL THESE:
# pip install mysql-connector-python
import mysql.connector
from flask_cors import CORS
from datetime import datetime, timedelta
from dateutil.relativedelta import *
import pusher
import os


app = Flask(__name__)
app.config["DEBUG"] = True
app.config["PROPAGATE_EXCEPTIONS"] = True  # Ensure exceptions are raised

CORS(app, origins=["https://eventsync.gcc.edu", "https://eventsync.gcc.edu:5000"])

db_config = {
    'host': '10.18.101.62',  
    'port': 3306,
    'user': 'jminnich1',
    'password': 'EventSync1!@',
    'database': 'event_sync'
}

GRAPH_API_URL = "https://graph.microsoft.com/v1.0/me"

def get_authenticated_user():
    """Fetches the authenticated user's email from Microsoft Graph API."""
    
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        print("ERROR: Missing Authorization header")
        return None, jsonify({"error": "Invalid or missing Authorization header"}), 403

    headers = {
        "Authorization": auth_header,
        "Accept": "application/json"
    }

    response = requests.get(GRAPH_API_URL, headers=headers)
    if response.status_code != 200:
        return None, jsonify({"error": "Failed to fetch user profile", "details": response.text}), 403

    data = response.json()
    user_email = data.get("mail")  # Extract user email

    if not user_email:
        return None, jsonify({"error": "Email not found in token response"}), 403

    return user_email, None, None  # No error, return email




pusher_client = pusher.Pusher(
  app_id='1939690',
  key='d2b56055f7edd36cb4b6',
  secret='fc12eddbc27d54975d56',
  cluster='us2',
  ssl=True
)

@app.route('/api/update_user_profile', methods=['POST'])
def update_user_profile():
     ###### validating email #####
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400
    
    print("body", body["userId"].lower())
    print("token",  user_email.lower())

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    ######   end validation  #####

    try:
        data = request.json
        email = data.get('userId')
        bio = data.get('bio')
        is_public = data.get('isPublic')
        notification_frequency = data.get('notificationFrequency')
        receive_friend_request = data.get('receiveFriendRequest')
        invited_to_event = data.get('invitedToEvent')
        event_cancelled = data.get('eventCancelled')

        # Validate required fields
        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Establish connection to the database
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        # Update the profile in the database
        updateQuery = """
            UPDATE User SET 
                bio = %s, 
                isPublic = %s, 
                notificationFrequency = %s, 
                friendRequest = %s, 
                eventInvite = %s, 
                eventCancelled = %s
            WHERE id = %s
        """
        mycursor.execute(updateQuery, (
            bio, is_public, notification_frequency, 
            receive_friend_request, invited_to_event, 
            event_cancelled, email
        ))

        # Commit the changes to the database
        conn.commit()
        mycursor.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/get_user/<string:id>', methods=['GET'])
def get_user(id):
    
    # user_email, error_response, status_code = get_authenticated_user()
    # if error_response:
    #     return error_response, status_code  

    # if id.lower() != user_email.lower():
    #     return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
   
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor(dictionary=True)  
        mycursor.execute("SELECT * FROM User WHERE id = %s", (id,))
        user = mycursor.fetchall()  # Fetch results as a list of dictionaries
        mycursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user), 200
    
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database query failed"}), 500

@app.route('/api/check_user/<string:id>', methods=['GET'])
def check_user(id):
       
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        print(error_response)
        return error_response, status_code   

    if id.lower() != user_email.lower():
        print("Unauthorized: userId does not match token email")
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
   
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("SELECT EXISTS(SELECT 1 FROM User WHERE id = %s)", (id,))
        result = mycursor.fetchone()
        user_exists = bool(result[0])
        mycursor.close()
        conn.close()

        return jsonify({"exists": user_exists})
    
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database query failed"}), 500
    
@app.route('/api/add_user/', methods=['POST'])
def add_user():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  # Handle authentication errors

    body = request.get_json()
    if not body or "email" not in body:
        return jsonify({"error": "Missing required 'email' field in request body"}), 400

    if body.get("email").lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403


    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  # Handle authentication errors

    body = request.get_json()
    if not body or "email" not in body:
        return jsonify({"error": "Missing required 'email' field in request body"}), 400

    if body.get("email").lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        data = request.get_json()
        print(data)

        id = data.get("email")  
        fname = data.get("firstName")
        lname = data.get("lastName")
        bio = data.get("bio", "")
        notification_frequency = data.get("notificationFrequency", "None")
        is_public = int(data.get("isPublic", 0))
        is_banned = 0  # Default to 0
        num_times_reported = int(data.get("numTimesReported", 0))  # Default to 0
        notification_id = 1  # Default to 1
        friend_request = int(data.get("receiveFriendRequest", 0))
        event_invite = int(data.get("invitedToEvent", 0))
        event_cancelled = int(data.get("eventCancelled", 0))
        gender = data.get("gender", "Undefined")  # Default to "Undefined"

        isAdmin = 0
        is_public = int(is_public)
        friend_request = int(friend_request)
        event_invite = int(event_invite)
        event_cancelled = int(event_cancelled)

        print("Final values:", (id, fname, lname, bio, isAdmin,
                        notification_frequency, is_public, is_banned, num_times_reported, 
                        notification_id, friend_request, event_invite, event_cancelled, gender))

        if not id or not fname or not lname:
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        sql = """INSERT INTO User (id, fname, lname, bio, 
                notificationFrequency, isAdmin, isPublic, isBanned, numTimesReported, 
                notificationId, friendRequest, eventInvite, eventCancelled, gender) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        
        values = (id, fname, lname, bio, 
                  notification_frequency, isAdmin, is_public, is_banned, num_times_reported, notification_id, friend_request, event_invite, event_cancelled, gender)

        mycursor.execute(sql, values)
        conn.commit()
        mycursor.close()
        conn.close()

        return jsonify({"message": "User added successfully"}), 201

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database insert failed"}), 500


@app.route('/get_events/<string:id>')
def get_events(id):

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        print(error_response)
        return error_response, status_code   

    if id.lower() != user_email.lower():
        print("Unauthorized: userId does not match token email")
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, EventInfo.creatorName, Event.views, Event.id, Event.eventInfoId, Event.numRsvps, EventInfo.RSVPLimit, EventInfo.isPublic, (
                            SELECT COUNT(*) FROM Event WHERE Event.eventInfoId = EventInfo.id ) AS recurs
                        from Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                     """)
        events_response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        events = [dict(zip(headers, row)) for row in events_response]

        for event in events:
            mycursor.execute(f"""
                SELECT Tag.id, Tag.name
                FROM Tag
                JOIN EventInfoToTag ON Tag.id = EventInfoToTag.tagId
                WHERE EventInfoToTag.eventInfoId = {event['eventInfoId']}
            """)
            tags_response = mycursor.fetchall()
            tags = [{
                "id": tag[0],
                "name": tag[1],
            } for tag in tags_response]
            event['tags'] = tags

        mycursor.close()
        conn.close()
        return jsonify(events)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_unfriended_users/<userId>/')
def get_unfriended_users(userId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query ="""
            SELECT u.fname, u.lname, u.id
            FROM User u
            WHERE u.id != %s
            AND u.id NOT IN (
                SELECT user1ID FROM UserToUser WHERE user2ID = %s
                UNION
                SELECT user2ID FROM UserToUser WHERE user1ID = %s
            );
        """
        mycursor.execute(query, (userId, userId, userId))
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body or "name" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
   
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = "INSERT INTO Tag (name, numTimesUsed, userId) VALUES (%s, %s, %s)"
        mycursor.execute(query, (body["name"], 0, body["userId"]))
        conn.commit()
    except mysql.connector.Error as err:
        return jsonify({"error": "Database error", "details": str(err)}), 500
    finally:
        mycursor.close()
        conn.close()

    return jsonify({"message": "Tag created successfully"}), 201

   

@app.route('/delete_custom_tag/<int:tagId>/', methods=['DELETE'])
def delete_custom_tag(tagId):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("DELETE FROM UserToTag WHERE tagId = %s;", (tagId,))
        mycursor.execute("DELETE FROM EventInfoToTag WHERE tagId = %s;", (tagId,))
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    
    userId = body["userId"]
    values: str = ""

    selectedTags = body["selectedTags"]
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
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
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
   
    # READ THIS: UNTESTED VALIDATION CODE
    # user_email, error_response, status_code = get_authenticated_user()
    # if error_response:
    #     return error_response, status_code  

    # body = request.json
    # if not body or "userId" not in body:
    #     return jsonify({"error": "Missing required fields in request body"}), 400

    # if body["userId"].lower() != user_email.lower():
    #     return jsonify({"error": "Unauthorized: userId does not match token email"}), 403



    #### UNESTED ^^^

    # eventInfoId = body["eventInfoId"]
    # values: str = ""

    # selectedTags = body["selectedTags"];
    # if len(selectedTags) == 0:
    #     return {}

    # for tag in selectedTags:
    #     values += f'("{eventInfoId}", {tag["id"]}), '

    # #Remove extra comma and space afterwards
    # values = values[:-2]

    # try:  
    #     conn = mysql.connector.connect(**db_config)
    #     mycursor = conn.cursor()
    #     query = f"""
    #         INSERT INTO EventInfoToTag (eventInfoId, tagId)
    #         VALUES {values};
    #     """
    #     mycursor.execute(query)
    #     conn.commit()
    #    mycursor.close()
    #    conn.close()
    # except mysql.connector.Error as err:
    #     print(f"Save Selected Tags Error: {err}")
    return {}

@app.post('/delete_event_deselected_tags/')
def delete_event_deselected_tags():
     # READ THIS: UNTESTED VALIDATION CODE BELOW
    # user_email, error_response, status_code = get_authenticated_user()
    # if error_response:
    #     return error_response, status_code  

    # body = request.json
    # if not body or "userId" not in body:
    #     return jsonify({"error": "Missing required fields in request body"}), 400

    # if body["userId"].lower() != user_email.lower():
    #     return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    #### UNESTED ^^^


    # eventInfoId = body["eventInfoId"]
    # deselectedTags = body["deselectedTags"]

    # #If we did not delete anything, there's no need to run the deletion query.
    # if len(deselectedTags) == 0:
    #     return {}

    # values: str = ""
    # for tag in deselectedTags:
    #     values += f'({eventInfoId}, {tag["id"]}), '
    # values = values[:-2]
    # try:  
    #     conn = mysql.connector.connect(**db_config)
    #     mycursor = conn.cursor()
    #     query = f"""
    #         DELETE FROM EventInfoToTag WHERE (eventInfoId, tagId) IN ({values});
    #     """
    #     mycursor.execute(query)
    #     conn.commit()
    #     if mycursor.rowcount == 0:
    #         return jsonify({"Message":"Tags not found"})
    #     else:
    #         return jsonify({"Message":"Tags deleted successfully"})
    # except mysql.connector.Error as err:
    #     print(f"Delete User Deselected Tags Error: {err}")
    return {}


@app.route('/get_tags/', defaults={'userId': None})
@app.route('/get_tags/<string:userId>/')
def get_tags(userId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId:
        if userId.lower() != user_email.lower():
            return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    else:
        if not user_email:
            return jsonify({"error": "Unauthorized: Missing valid authenticated user"}), 403

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        if userId:
            query = """
                SELECT Tag.id, Tag.name, Tag.userId 
                FROM Tag 
                WHERE Tag.userId = %s OR Tag.userId IS NULL;
            """
            mycursor.execute(query, (userId,))
        else:
            query = "SELECT Tag.id, Tag.name, Tag.userId FROM Tag"
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

@app.route('/get_user_tags/<string:userId>/')
def get_user_tags(userId):

    # user_email, error_response, status_code = get_authenticated_user()
    # if error_response:
    #     return error_response, status_code  

    # if userId.lower() != user_email.lower():
    #     return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: Missing valid authenticated user"}), 403
    
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


@app.route('/get_friends/<userId>/')
def get_friends(userId):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
            SELECT u.fname, u.lname, u.id
            FROM User u
            WHERE u.id IN (
                SELECT user2ID 
                FROM UserToUser 
                WHERE user1ID = %s
                AND isFriend = true
                UNION
                SELECT user1ID 
                FROM UserToUser 
                WHERE user2ID = %s
                AND isFriend = true
            );
        """
        mycursor.execute(query, (userId, userId,))
        response = mycursor.fetchall()
        headers = mycursor.description
        res = sqlResponseToJson(response, headers)
        mycursor.close()
        conn.close()
        return res
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_pending_friends/<userId>/')
def get_pending_friends(userId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor(dictionary=True)
        pendingQuery = """
            SELECT u.fname, u.lname, u.id
            FROM User u
            WHERE u.id IN (
                SELECT user2ID FROM UserToUser
                WHERE user1ID = %s AND isFriend = false
            );
        """
        mycursor.execute(pendingQuery, (userId,))
        pendingResponse = mycursor.fetchall()
        requestsQuery = """
            SELECT u.fname, u.lname, u.id
            FROM User u
            WHERE u.id IN (
                SELECT user1ID FROM UserToUser
                WHERE user2ID = %s AND isFriend = false
            );
        """
        mycursor.execute(requestsQuery, (userId,))
        requestsResponse = mycursor.fetchall()
        mycursor.close()
        conn.close()
        return jsonify({
            "pending": pendingResponse,
            "requests": requestsResponse
        })
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_friend_requests/<userId>/')
def get_friend_requests(userId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
            SELECT COUNT(*)
            FROM User u
            WHERE u.id IN (
                SELECT user1ID FROM UserToUser
                WHERE user2ID = %s AND isFriend = false
            );
        """
        mycursor.execute(query, (userId,))
        response = mycursor.fetchone()
        mycursor.close()
        conn.close()
        return jsonify({"friendRequestsCount": response[0]})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/accept_friend_request/<string:userId>/<string:friendId>/', methods=['POST'])
def accept_friend_request(userId, friendId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
                UPDATE UserToUser
                SET isFriend = TRUE
                WHERE user1Id = %s AND user2Id = %s;
                """
        mycursor.execute(query, (friendId, userId))

        # Create chat for friend
        createChat = f"""
            INSERT INTO Chat (name, chatType) VALUES ("", 'Individual');
        """
        mycursor.execute(createChat)
        chatId = mycursor.lastrowid

        # add relationships in ChatToUser
        chatToUser = f"""
                INSERT INTO ChatToUser (chatId, userId) VALUES ({chatId}, '{friendId}');
            """
        mycursor.execute(chatToUser)
        chatToUser = f"""
            INSERT INTO ChatToUser (chatId, userId) VALUES ({chatId}, '{userId}');
            """
        mycursor.execute(chatToUser)

        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/reject_friend_request/<string:userId>/<string:friendId>/', methods=['DELETE'])
def reject_friend_request(userId, friendId):
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
                DELETE FROM UserToUser
                WHERE user1Id = %s AND user2Id = %s;
                """
        mycursor.execute(query, (friendId, userId))
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/remove_friend_request/<string:userId>/<string:friendId>/', methods=['DELETE'])
def remove_friend_request(userId, friendId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
                DELETE FROM UserToUser
                WHERE user1Id = %s AND user2Id = %s;
                """
        mycursor.execute(query, (userId, friendId))
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/add_friend/<string:userId>/<string:friendId>/', methods=['POST'])
def add_friend(userId, friendId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
                INSERT INTO UserToUser(user1Id, user2Id, isFriend)
                VALUES (%s, %s, FALSE)
                """
        mycursor.execute(query, (userId, friendId))
        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/remove_friend/<string:userId>/<string:friendId>/', methods=['DELETE'])
def remove_friend(userId, friendId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
                DELETE FROM UserToUser
                WHERE (user1Id = %s AND user2Id = %s) OR (user1Id = %s AND user2Id = %s);
                """
        mycursor.execute(query, (userId, friendId, friendId, userId))
        
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        
        setEventInfoId = f"SET @eventInfoId = (SELECT eventInfoId FROM Event WHERE id = {eventId});"
        setChatId = "SET @chatId = (SELECT chatId FROM EventInfoToChat WHERE eventInfoId = @eventInfoId);"
        deleteEventInfoToChat = f"DELETE FROM EventInfoToChat WHERE eventInfoId = @eventInfoId"
        deleteChat = f"DELETE FROM Chat WHERE id = @chatId"
        mycursor.execute(setEventInfoId)
        mycursor.execute(setChatId)
        mycursor.execute(deleteEventInfoToChat)
        mycursor.execute(deleteChat)

        mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM EventToUser WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM Event WHERE id = %s", (eventId,))

        deleteEventInfo = f"DELETE FROM EventInfo WHERE id = @eventInfoId"
        mycursor.execute(deleteEventInfo)

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

@app.route('/delete_one_recurring_event/<int:eventId>/', methods=['DELETE'])
def delete_one_recurring_event(eventId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM EventToUser WHERE eventId = %s", (eventId,))
        mycursor.execute("DELETE FROM Event WHERE id = %s", (eventId,))

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


@app.route('/delete_multiple_events/<int:eventId>/', methods=['DELETE'])
def delete_mult_event(eventId):
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SET @eventInfoId = (SELECT eventInfoId FROM Event WHERE id = {eventId});
                        
                     """)
        setChatId = "SET @chatId = (SELECT chatId FROM EventInfoToChat WHERE eventInfoId = @eventInfoId);"
        deleteEventInfoToChat = f"DELETE FROM EventInfoToChat WHERE eventInfoId = @eventInfoId"
        deleteChat = f"DELETE FROM Chat WHERE id = @chatId"
        mycursor.execute(setChatId)
        mycursor.execute(deleteEventInfoToChat)
        mycursor.execute(deleteChat)
        
        mycursor.execute("""DELETE FROM Event
                        WHERE eventInfoId = @eventInfoId;""")
        deleteEventInfo = f"DELETE FROM EventInfo WHERE id = @eventInfoId"
        mycursor.execute(deleteEventInfo)
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

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

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

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "creatorId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["creatorId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

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
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
                        VALUES ("{data["creatorId"]}", 0, "{data["title"]}", "{data["description"]}", "{data["locationName"]}", "", {data["rsvpLimit"]}, {data["isPublic"]}, {data["isWeatherSensitive"]}, 0, "{currentDateTime}", "{data["venmo"]}", "{data["recurFrequency"]}", "{data["creatorName"]}");
                     """
        mycursor.execute(insertEventInfo)
        eventInfoId = mycursor.lastrowid
        
        # Create chat for event
        createChat = f"""
            INSERT INTO Chat (name, chatType) VALUES ("{data["title"]}", 'Event');
        """
        mycursor.execute(createChat)
        chatId = mycursor.lastrowid

        # add relationship from chat to eventInfo
        addEventInfoToChat = f"""
                INSERT INTO EventInfoToChat (chatId, eventInfoId) VALUES ({chatId}, {eventInfoId});
            """
        mycursor.execute(addEventInfoToChat)

        insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
                        VALUES ({eventInfoId}, "{db_startDateTime}", "{db_endDateTime}", "{currentDateTime}", 0, 0);"""
        tags = data["tags"]
        for tag in tags:
            updateTag = f"""
                            UPDATE Tag
                            SET numTimesUsed = numTimesUsed + 1
                            WHERE name="{tag["name"]}"
                        """
            mycursor.execute(updateTag)
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

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if user_id.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName, Event.views, (
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
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName, Event.views
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "creatorId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400
    
    if body["creatorId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    data = request.json
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        reqStrFormat = '%Y-%m-%dT%H:%M:%S.%fZ'
        dateCreated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        insertEventInfo = f"""
                        INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
                        VALUES ("{data["creatorId"]}", 0, "{data["title"]}", "{data["description"]}", "{data["locationName"]}", "", 10, True, False, 0, "{dateCreated}", "{data["venmo"]}", "{data["recurFrequency"]}", "{data["creatorName"]}");
                     """
        mycursor.execute(insertEventInfo)
        eventInfoId = mycursor.lastrowid
        mycursor.execute("SET @eventInfoId = last_insert_id();")

        # Create chat for event
        createChat = f"""
            INSERT INTO Chat (name, chatType) VALUES ("{data["title"]}", 'Event');
        """
        mycursor.execute(createChat)
        chatId = mycursor.lastrowid

        # add relationship from chat to eventInfo
        addEventInfoToChat = f"""
                INSERT INTO EventInfoToChat (chatId, eventInfoId) VALUES ({chatId}, {eventInfoId});
            """
        mycursor.execute(addEventInfoToChat)

        
        tags = data["tags"]
        for tag in tags:
            updateTag = f"""
                            INSERT INTO EventInfoToTag(eventInfoId, tagId)
                            VALUES ({eventInfoId} , {tag["id"]});
                        """
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
            insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
                        VALUES (@eventInfoId, "{curStartDate.strftime("%Y-%m-%d %H:%M:%S")}", "{curEndDate.strftime("%Y-%m-%d %H:%M:%S")}", "{dateCreated}", 0, 0);"""
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

@app.route('/get_event_creator_name/<string:user_id>/', methods=['GET'])
def get_user_name(user_id: str):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""SELECT CONCAT(fname, ' ', lname) AS fullName
                            FROM User
                            WHERE id = '{user_id}';""")
        response = mycursor.fetchall()
      
        headers = [x[0] for x in mycursor.description]
        user_name = dict(zip(headers, response[0]))

        mycursor.close()
        conn.close()
        return jsonify(user_name)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.get('/get_event_info/<int:event_info_id>/')
def get_event_info(event_info_id):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""SELECT * FROM EventInfo WHERE id = {event_info_id}""")
        response = mycursor.fetchall()
        headers = mycursor.description

        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_event/<int:event_id>/<string:user_id>', methods=['GET'])
def get_event(event_id: int, user_id: str):

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if user_id.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

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
                        EventInfo.recurFrequency,
                        Event.startTime, 
                        Event.endTime,
                        EventInfo.creatorName
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

        mycursor.close()
        conn.close()
        return jsonify(event)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/editEvent/<int:eventId>', methods=['PUT'])
def edit_event(eventId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "creatorId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["creatorId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""
                        SELECT Event.eventInfoId
                        FROM Event
                        JOIN EventInfo ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id = {eventId}
                    """)
        eventInfoId = mycursor.fetchone()[0]
        if not eventInfoId:
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
                                    venmo = '{data["venmo"]}',
                                    recurFrequency = '{data["recurFrequency"]}'
                                WHERE id = {eventInfoId}
                            """
            mycursor.execute(eventInfoUpdate)

            reqStrFormat = '%Y-%m-%dT%H:%M:%S.%fZ'
            dateCreated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            curStartDate = datetime.strptime(data["startDateTime"], reqStrFormat)
            curEndDate = datetime.strptime(data["endDateTime"], reqStrFormat)
            mycursor.execute(f"""
                    SELECT id, startTime, endTime
                    FROM Event
                    WHERE eventInfoId = {eventInfoId}
                    ORDER BY startTime
                """)
            existing_events = mycursor.fetchall()
            existing_event_index = 0

            if len(existing_events) > 1:
                print("Updating all events")
                endDate = ""
                if data["endRecurDateTime"]:
                    endDate = datetime.strptime(data["endRecurDateTime"], reqStrFormat)
                else:
                    endDate = existing_events[-1][2]

                delta = ""
                if data["recurFrequency"] == "":
                    newDelta = f"""
                                    SELECT EventInfo.recurFrequency
                                    FROM EventInfo
                                    WHERE id = {eventInfoId}
                                """
                    mycursor.execute(newDelta)
                    delta = mycursor.fetchone()[0]
                else:
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
                    if existing_event_index < len(existing_events):
                        print("Updating existing event")
                        existing_event = existing_events[existing_event_index]
                        eventUpdate = f"""
                            UPDATE Event
                            SET startTime = '{curStartDate.strftime("%Y-%m-%d %H:%M:%S")}', endTime = '{curEndDate.strftime("%Y-%m-%d %H:%M:%S")}'
                            WHERE id = {existing_event[0]}
                        """
                        mycursor.execute(eventUpdate)
                        existing_event_index += 1
                    else:
                        insertEvent = f"""INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
                                    VALUES ({eventInfoId}, "{curStartDate.strftime("%Y-%m-%d %H:%M:%S")}", "{curEndDate.strftime("%Y-%m-%d %H:%M:%S")}", "{dateCreated}"), 0, 0;"""
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

                    removeTag = f"""
                                DELETE FROM EventInfoToTag WHERE eventInfoId = {eventInfoId};
                            """
                    mycursor.execute(removeTag)
                    tags = data["tags"]
                    for tag in tags:
                        updateTag = f"""
                                        UPDATE Tag
                                        SET numTimesUsed = numTimesUsed + 1
                                        WHERE name="{tag["name"]}"
                                    """
                        mycursor.execute(updateTag)

                        updateTag = f"""
                                        INSERT INTO EventInfoToTag(eventInfoId, tagId)
                                        VALUES ({eventInfoId} , {tag["id"]});
                                    """
                        print(updateTag)
                        mycursor.execute(updateTag)
                if existing_event_index < len(existing_events):
                    outdated_events = existing_events[existing_event_index:]
                    for event in outdated_events:
                        mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (event[0],))
                        mycursor.execute("DELETE FROM EventToUser WHERE eventId = %s", (event[0],))
                        mycursor.execute("DELETE FROM Event WHERE id = %s", (event[0],))
            else:
                print("Updating only event")
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

                eventUpdate = f"""
                    UPDATE Event
                    SET startTime = '{db_startDateTime}', endTime = '{db_endDateTime}'
                    WHERE id = {eventId}
                """
                mycursor.execute(eventUpdate)

                for el in itemIds:
                        insertItem = f"""
                                        INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                                        VALUES (@eventId, {el[0]}, {el[1]["amountNeeded"]}, 0);
                                    """
                        mycursor.execute(insertItem)

                removeTag = f"""
                            DELETE FROM EventInfoToTag WHERE eventInfoId = {eventInfoId};
                        """
                mycursor.execute(removeTag)
                tags = data["tags"]
                for tag in tags:
                    updateTag = f"""
                                    UPDATE Tag
                                    SET numTimesUsed = numTimesUsed + 1
                                    WHERE name="{tag["name"]}"
                                """
                    mycursor.execute(updateTag)

                    updateTag = f"""
                                    INSERT INTO EventInfoToTag(eventInfoId, tagId)
                                    VALUES ({eventInfoId} , {tag["id"]});
                                """
                    print(updateTag)
                    mycursor.execute(updateTag)
        else:
            print("Updating single event")
            currentDateTime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            eventInfoInsert = f"""
                INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
                VALUES ('{data["creatorId"]}', 0, '{data["title"]}', '{data["description"]}', '{data["locationName"]}', '', {data["rsvpLimit"]}, {int(data["isPublic"])}, {int(data["isWeatherSensitive"])}, 0, '{currentDateTime}', '{data["venmo"]}', '{data["recurFrequency"]}', '{data["creatorName"]}');
            """
            mycursor.execute(eventInfoInsert)
            eventInfoId = mycursor.lastrowid
            eventUpdate = f"""
                UPDATE Event
                SET eventInfoId = {eventInfoId}, startTime = '{db_startDateTime}', endTime = '{db_endDateTime}'
                WHERE id = {eventId}
            """
            mycursor.execute(eventUpdate)
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
            for el in itemIds:
                insertItem = f"""
                                INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                                VALUES ({eventId}, {el[0]}, {el[1]["amountNeeded"]}, 0);
                            """
                mycursor.execute(insertItem)

            removeTag = f"""
                        DELETE FROM EventInfoToTag WHERE eventInfoId = {eventInfoId};
                    """
            mycursor.execute(removeTag)
            tags = data["tags"]
            for tag in tags:
                updateTag = f"""
                                UPDATE Tag
                                SET numTimesUsed = numTimesUsed + 1
                                WHERE name="{tag["name"]}"
                            """
                mycursor.execute(updateTag)

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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
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

@app.route('/rsvp', methods=['POST'])
def rsvp():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        userId = body.get("userId")
        eventId = body.get("eventId")

        mycursor.execute(f"""
            SELECT EventInfo.RSVPLimit, Event.numRsvps
            FROM Event
            JOIN EventInfo ON Event.eventInfoId = EventInfo.id
            WHERE Event.id = {eventId}
        """)
        result = mycursor.fetchone()
        rsvpLimit = result[0]
        numRsvps = result[1]

        if rsvpLimit != 0 and numRsvps >= rsvpLimit:
            return jsonify({"message": "RSVP limit reached"}), 400
        insertRsvp = f"""
            INSERT INTO EventToUser (userId, eventId)
            VALUES ('{userId}', {eventId});
        """
        mycursor.execute(insertRsvp)

        updateNumRsvps = f"""
            UPDATE Event
            SET numRsvps = numRsvps + 1
            WHERE id = {eventId};
        """
        mycursor.execute(updateNumRsvps)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "RSVP successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/unrsvp', methods=['POST'])
def unrsvp():
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        userId = body.get("userId")
        eventId = body.get("eventId")
        
        deleteRsvp = f"""
            DELETE FROM EventToUser
            WHERE userId = '{userId}' AND eventId = {eventId};
        """
        mycursor.execute(deleteRsvp)
        deleteItemSignUps = f"""
            DELETE FROM UserToItem
            WHERE userId = '{userId}' AND eventId = {eventId};
        """
        mycursor.execute(deleteItemSignUps)
        
        conn.commit()
        mycursor.close()
        conn.close()
        
        return jsonify({"message": "Un-RSVP successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/check_rsvp', methods=['POST'])
def check_rsvp():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "userId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["userId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        userId = body.get("userId")
        eventId = body.get("eventId")

        checkRsvp = f"""
            SELECT * FROM EventToUser
            WHERE userId = '{userId}' AND eventId = {eventId};
        """
        mycursor.execute(checkRsvp)
        result = mycursor.fetchone()
        
        mycursor.close()
        conn.close()
        
        if result:
            return jsonify({"rsvp": True})
        else:
            return jsonify({"rsvp": False})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_rsvps', methods=['POST'])
def get_rsvps():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        eventId = body.get("eventId")

        if eventId is None:
            return jsonify({"message": "Invalid eventId"}), 400

        mycursor.execute(f"""
                        SELECT User.id, User.fname, User.lname
                        FROM User
                        JOIN EventToUser ON User.id = EventToUser.userId
                        WHERE EventToUser.eventId = {eventId}
                    """)
        users_response = mycursor.fetchall()
        users = [{'id': user[0], 'fname': user[1], 'lname': user[2]} for user in users_response]

        mycursor.close()
        conn.close()
        return jsonify(users)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {} 

@app.route('/get_my_groups/<string:userId>')
def get_my_groups(userId):

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(
            f"""
            SELECT GroupOfUser.id, GroupOfUser.groupName, GroupOfUser.creatorId, GroupOfUser.chatId, GroupOfUser.numTimesReported
            FROM GroupOfUserToUser
            INNER JOIN GroupOfUser 
            ON GroupOfUserToUser.groupId = GroupOfUser.id 
            WHERE GroupOfUserToUser.userId = "{userId}"
            """
        )
        group_responses = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        groups = [dict(zip(headers, group_response)) for group_response in group_responses]

        for group in groups:
            append_users_to_group_object(group, mycursor)

        mycursor.close()
        conn.close()
        return jsonify(groups)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.get('/get_group/<int:groupId>')
def get_group(groupId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
       
        # Get group info
        mycursor.execute(
            f"""
            SELECT * FROM GroupOfUser WHERE id = {groupId};
            """
        )
        response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        group = dict(zip(headers, response[0]))

        append_users_to_group_object(group, mycursor)

        mycursor.close()
        conn.close()
        return jsonify(group)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

def append_users_to_group_object(group, mycursor):
    mycursor.execute(
        f"""
        SELECT User.id, User.fname, User.lname
        FROM GroupOfUserToUser
        INNER JOIN User 
        ON GroupOfUserToUser.userId = User.id 
        WHERE GroupOfUserToUser.groupId = {group["id"]};
        """
    )
    users_response = mycursor.fetchall()
    users = [{
        "id": tag[0],
        "fname": tag[1],
        "lname": tag[2]
    } for tag in users_response]
    group["users"] = users

@app.post('/edit_group')
def edit_group():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "creatorId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["creatorId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        groupId = body.get("id")
        groupName = body.get("groupName")
        creatorId = body.get("creatorId")
        users = body.get("users")

        # Update users in group
        removeGroupUsers = f"""
            DELETE FROM GroupOfUserToUser WHERE groupId = {groupId}
        """
        mycursor.execute(removeGroupUsers)

        removeChatUsers = f"""
            DELETE ChatToUser FROM GroupOfUser JOIN ChatToUser ON GroupOfUser.chatId = ChatToUser.chatId WHERE GroupOfUser.id = {groupId};
        """
        mycursor.execute(removeChatUsers)

        add_users_to_group(users, groupId, mycursor)

        # Update name of group
        updateGroupName = f"""
            UPDATE GroupOfUser SET groupName = "{groupName}" WHERE id = {groupId};
        """
        mycursor.execute(updateGroupName)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/create_group')
def create_group():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "creatorId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["creatorId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        groupName = body.get("groupName")
        creatorId = body.get("creatorId")
        users = body.get("users")

        users_and_creator = users.copy()
        users_and_creator.append({ "id": creatorId })

        # Create chat for group
        createChat = f"""
            INSERT INTO Chat (name, chatType) VALUES ("{groupName}", 'Group');
        """
        mycursor.execute(createChat)
        chatId = mycursor.lastrowid

        # Create group
        createGroup = f"""
           INSERT INTO GroupOfUser (groupName, creatorId, chatId, numTimesReported) VALUES ("{groupName}", "{creatorId}", {chatId}, 0);
        """
        mycursor.execute(createGroup)
        groupId = mycursor.lastrowid

        # add relationship from chat to group 
        addGroupOfUserToChat = f"""
                INSERT INTO GroupOfUserToChat (chatId, groupOfUserId) VALUES ({chatId}, {groupId});
            """
        mycursor.execute(addGroupOfUserToChat)

        add_users_to_group(users_and_creator, groupId, mycursor)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

def add_users_to_group(users, groupId, mycursor):
    # Get chat id of group in question
    getChatId = f"SELECT chatId, creatorId FROM GroupOfUser WHERE GroupOfUser.id = {groupId};"
    mycursor.execute(getChatId)
    response = mycursor.fetchone()
    chatId = response[0]
    creatorId = response[1]

    # Add each selected user to created group & group chat
    for user in users:
        addUserToGroup = f"""
            INSERT INTO GroupOfUserToUser (groupId, userId) VALUES ({groupId}, "{user["id"]}");
        """
        mycursor.execute(addUserToGroup)

        addUserToChat = f"""
            INSERT INTO ChatToUser (chatId, userId) VALUES ({chatId}, "{user["id"]}");
        """
        mycursor.execute(addUserToChat)

@app.post('/remove_user_from_group')
def remove_user_from_group():
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        currentUserId = body.get("currentUserId")
        groupId = body.get("groupId")

        removeUserFromGroup = f"""
            DELETE FROM GroupOfUserToUser WHERE userId = "{currentUserId}" AND groupId = {groupId};
        """
        mycursor.execute(removeUserFromGroup)

        removeUserFromGroupChat = f"""
            DELETE ChatToUser FROM GroupOfUser JOIN ChatToUser ON GroupOfUser.chatId = ChatToUser.chatId
            WHERE ChatToUser.userId = "{currentUserId}" AND GroupOfUser.id = {groupId};
        """
        mycursor.execute(removeUserFromGroupChat)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/delete_group')
def delete_group():
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        groupId = body.get("groupId")

        getChatId = f"SET @chatId = (SELECT chatId FROM GroupOfUserToChat WHERE groupOfUserId = {groupId});"

        removeGroupOfUserToChat = f"""
            DELETE FROM GroupOfUserToChat WHERE groupOfUserId = {groupId};
        """
        mycursor.execute(getChatId)
        mycursor.execute(removeGroupOfUserToChat)

        removeGroupUsers = f"""
            DELETE FROM GroupOfUserToUser WHERE groupId = {groupId};
        """
        mycursor.execute(removeGroupUsers)

        removeGroup = f"""
            DELETE FROM GroupOfUser WHERE id = {groupId};
        """
        mycursor.execute(removeGroup)

        removeChat = f"""
            DELETE FROM Chat WHERE id = @chatId;
        """
        mycursor.execute(removeChat)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_reports/<string:userId>/')
def get_reports(userId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        # make sure they're an  admin
        admin_query = "SELECT isAdmin FROM User WHERE id = %s"
        mycursor.execute(admin_query, (user_email,))
        result = mycursor.fetchone()
        if not result or result[0] != 1: 
            mycursor.close()
            conn.close()
            return jsonify({"error": "Forbidden: Only admins can access reports"}), 403

        mycursor.execute("""
                        SELECT * FROM Report;
                     """)
        response = mycursor.fetchall()
        headers = mycursor.description
        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/reportEvent', methods=['POST'])
def reportEvent():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "reportedBy" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["reportedBy"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        eventDetails = body.get("details")
        eventReportedBy = body.get("reportedBy")
        eventId = body.get("reportedEventId")

        mycursor.execute(f""" 
            SELECT eventInfoId FROM Event WHERE id = {eventId};
        """)
        eventInfoId = mycursor.fetchone()[0]

        reportEvent = f"""
            INSERT INTO Report (details, reportedBy, reportedEventInfoId)
            VALUES ("{eventDetails}", "{eventReportedBy}", {eventInfoId});
        """
        print(reportEvent)
        mycursor.execute(reportEvent)
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "report successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/reportGroup', methods=['POST'])
def reportGroup():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "reportedBy" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["reportedBy"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        groupDetails = body.get("details")
        groupReportedBy = body.get("reportedBy")
        groupId = body.get("reportedGroupId")

        mycursor.execute(f""" 
            SELECT id FROM GroupOfUser WHERE id = {groupId};
        """)
        reportedGroupId = mycursor.fetchone()[0]

        reportGroup = f"""
            INSERT INTO Report (details, reportedBy, reportedGroupId)
            VALUES ("{groupDetails}", "{groupReportedBy}", {reportedGroupId});
        """
        mycursor.execute(reportGroup)

        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "report successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/reportMessage', methods=['POST'])
def reportMessage():
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "reportedBy" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["reportedBy"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        messageDetails = body.get("details")
        messageReportedBy = body.get("reportedBy")
        messageId = body.get("reportedMessageId")

        reportMessage = f"""
            INSERT INTO Report (details, reportedBy, reportedMessageId)
            VALUES ("{messageDetails}", "{messageReportedBy}", {messageId});
        """
        mycursor.execute(reportMessage)
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "report successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/reportUser', methods=['POST'])
def reportUser():
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "reportedBy" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["reportedBy"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        userDetails = body.get("details")
        userReportedBy = body.get("reportedBy")
        userId = body.get("reportedUserId")

        reportUser = f"""
            INSERT INTO Report (details, reportedBy, reportedUserId)
            VALUES ("{userDetails}", "{userReportedBy}", "{userId}");
        """
        mycursor.execute(reportUser)
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "report successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/delete_report')
def delete_report():
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        reportId = body.get("reportId")

        removeGroupUsers = f"""
            DELETE FROM Report WHERE id = {reportId};
        """
        mycursor.execute(removeGroupUsers)

        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/warn_user')
def warn_user():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        reportedUserId = body.get("reportedUserId")
        warningMessage = body.get("warningMessage")
        timeSent = body.get("timeSent")

        #Try to find a chat between the warner and the warnee exclusively
        usersInWarnChat = 2
        if user_email.lower() == reportedUserId:
            usersInWarnChat = 1

        getChatIdBetweenUsers = f"""
            SELECT Chat.chatId FROM (
                SELECT Chat.id AS chatId, COUNT(ChatToUser.userId) AS userCount FROM ChatToUser JOIN (
                    SELECT Chat.id FROM Chat JOIN ChatToUser ON Chat.id = ChatToUser.chatId WHERE Chat.chatType = "Individual" GROUP BY Chat.id HAVING COUNT(ChatToUser.userId) = {usersInWarnChat}
                ) AS Chat ON Chat.id = ChatToUser.chatId WHERE ChatToUser.userId = "{user_email.lower()}" OR ChatToUser.userId = "{reportedUserId}" GROUP BY Chat.id
            ) AS Chat WHERE Chat.userCount = {usersInWarnChat};
        """
        mycursor.execute(getChatIdBetweenUsers)
        response = mycursor.fetchone()

        #If one exists, we'll reuse it
        if response:
            warnChatId = response[0]
        else:
            #If not, we need to set up a new chat b/t the warner & warnee
            createWarnChat = f"""
                INSERT INTO Chat (name, chatType) VALUES ("Warning", "Individual");
            """
            mycursor.execute(createWarnChat)
            warnChatId = mycursor.lastrowid

            addWarnerToWarnChat = f"""
                INSERT INTO ChatToUser (chatId, userId) VALUES ({warnChatId}, "{user_email.lower()}");
            """
            mycursor.execute(addWarnerToWarnChat)

            if usersInWarnChat == 2:
                addWarneeToWarnChat = f"""
                    INSERT INTO ChatToUser (chatId, userId) VALUES ({warnChatId}, "{reportedUserId}");
                """
                mycursor.execute(addWarneeToWarnChat)

        # Finally, we will post an automated message from the warner to the group chat with the warnee.
        createWarningMessage = f"""
            INSERT INTO Message (chatId, senderId, messageContent, timeSent) 
                VALUES ({warnChatId}, "{user_email.lower()}", "{warningMessage}", "{timeSent}");
        """
        mycursor.execute(createWarningMessage)

        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/message/', methods=['POST'])
def message():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    body = request.json
    if not body or "senderId" not in body:
        return jsonify({"error": "Missing required fields in request body"}), 400

    if body["senderId"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    data = request.get_json()
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f""" 
            INSERT INTO Message (chatId, senderId, messageContent, timeSent) 
                VALUES ({data['chatId']}, "{data["senderId"]}", "{data["messageContent"]}", "{data["timeSent"]}");
        """)
        conn.commit()
        mycursor.close()
        conn.close()
        pusher_client.trigger(f'chat-{data["chatId"]}', 'new-message', {'messageContent': data['messageContent'], 'senderId': data['senderId'],
                                    'chatId': data['chatId'], 'timeSent': data['timeSent'], 'id': data['id']}) # TODO: change id
        return "message sent"
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.get('/get_message/<int:message_id>')
def get_message(message_id: int):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"SELECT * FROM Message WHERE id={message_id};")
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_chat_hist/<int:chat_id>', methods=['GET'])
def get_chat_hist(chat_id: int):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"SELECT * FROM Message WHERE chatId={chat_id};")
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"chats": sqlResponseToList(response, headers)})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_my_chats/<string:user_id>', methods=['GET'])
def get_my_chats(user_id: str):

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if user_id.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""(SELECT Chat.id, groupStuff.groupName AS name, Chat.chatType FROM Chat
                            JOIN (SELECT GroupOfUser.chatId, GroupOfUser.groupName FROM GroupOfUserToChat
                            JOIN GroupOfUserToUser ON GroupOfUserToChat.groupOfUserId = GroupOfUserToUser.groupId
                            JOIN GroupOfUser ON GroupOfUserToChat.groupOfUserId = GroupOfUser.id
                            WHERE GroupOfUserToUser.userId = '{user_id}') AS groupStuff
                            ON Chat.id = groupStuff.chatId WHERE Chat.chatType = 'Group')
                            UNION 
                            (SELECT Chat.id, EventInfo.title AS name, Chat.chatType FROM Chat
                            JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
                            JOIN Event ON Event.eventInfoId = EventInfoToChat.eventInfoId
                            JOIN EventToUser ON EventToUser.eventId = Event.id
                            JOIN EventInfo ON EventInfo.id = EventInfoToChat.eventInfoId
                            WHERE EventToUser.userId = "{user_id}" AND Chat.chatType = 'Event')
                            UNION
                            (SELECT Chat.id, EventInfo.title AS name, Chat.chatType FROM Chat
                            JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
                            JOIN EventInfo ON EventInfo.id = EventInfoToChat.eventInfoId
                            WHERE EventInfo.creatorId = "{user_id}" AND Chat.chatType = 'Event')
                            UNION
                            (SELECT Chat.id, CONCAT(otherUser.fname, " ", otherUser.lname) AS name, Chat.chatType FROM Chat 
                            JOIN ChatToUser ON Chat.id = ChatToUser.chatId
                            JOIN (SELECT * FROM ChatToUser 
                                JOIN User ON ChatToUser.userId = User.id
                                WHERE ChatToUser.userId != '{user_id}'
                                ) AS otherUser
                            ON ChatToUser.chatId = otherUser.chatId
                            WHERE ChatToUser.userId = 'harnlyam20@gcc.edu' AND Chat.chatType = 'Individual')""")
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        # return sqlResponseToJson(response, headers)
        return [
                {
                    "chatType": "Group",
                    "id": 46,
                    "name": "Another Chat Test Group",
                    "unreadMsgs": False,
                    "lastMsg": None
                },
                {
                    "chatType": "Event",
                    "id": 29,
                    "name": "AI Study Session",
                    "unreadMsgs": False,
                    "lastMsg": None
                },
                {
                    "chatType": "Event",
                    "id": 49,
                    "name": "Wolfe test",
                    "unreadMsgs": False,
                    "lastMsg": None
                },
                {
                    "chatType": "Individual",
                    "id": 134,
                    "name": "fake dude",
                    "unreadMsgs": True,
                    "lastMsg": {
                        "chatId": 134,
                        "id": 260,
                        "imagePath": None,
                        "messageContent": "Hi fake dude!",
                        "senderId": "harnlyam20@gcc.edu",
                        "timeSent": "Sat, 29 Mar 2025 14:59:48 GMT"
                    }
                }
            ]
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_chat/<string:chat_id>', methods=['GET'])
def get_chat(chat_id: str):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""(SELECT Chat.id, GroupOfUser.groupName AS name, Chat.chatType FROM Chat
                            JOIN GroupOfUser ON GroupOfUser.chatId = Chat.id 
                            WHERE Chat.id = {chat_id})
                            UNION 
                            (SELECT Chat.id, EventInfo.title AS name, Chat.chatType FROM Chat
                            JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
                            JOIN EventInfo ON EventInfo.id = EventInfoToChat.eventInfoId
                            WHERE Chat.id = {chat_id})
                            UNION
                            (SELECT Chat.id, "" AS name, Chat.chatType FROM Chat 
                            JOIN ChatToUser ON Chat.id = ChatToUser.chatId
                            WHERE Chat.id = {chat_id})
                            LIMIT 1""")
        response = mycursor.fetchall()
        headers = mycursor.description
        chat = sqlResponseToList(response, headers)[0]
        mycursor.execute(f"""(SELECT id, fname, lname FROM User
                                JOIN GroupOfUserToUser ON User.id = GroupOfUserToUser.userId
                                JOIN GroupOfUserToChat ON GroupOfUserToUser.groupId = GroupOfUserToChat.groupOfUserId
                                WHERE GroupOfUserToChat.chatId = {chat_id})
                            UNION
                            (SELECT User.id, fname, lname FROM User
                                JOIN EventToUser ON User.id = EventToUser.userId
                                JOIN Event ON EventToUser.eventId = Event.id
                                JOIN EventInfoToChat ON EventInfoToChat.eventInfoId = Event.eventInfoId
                                WHERE EventInfoToChat.chatId = {chat_id})
                            UNION
                            (SELECT id, fname, lname 
                                FROM User WHERE id IN (
                                SELECT userId FROM ChatToUser
                                WHERE chatId = {chat_id}))""")
        response = mycursor.fetchall()
        headers = mycursor.description
        users = sqlResponseToList(response, headers)
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({f"users": users, "chat": chat})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_individual_chat_id/<string:curr_user_id>/<string:other_user_id>', methods=['GET'])
def get_individual_chat_id(curr_user_id: str, other_user_id: str):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""SELECT ChatToUser.chatId FROM ChatToUser 
                            JOIN (SELECT * FROM ChatToUser WHERE userId = '{other_user_id}') AS otherUserTable
                            ON ChatToUser.chatId = otherUserTable.chatId
                            WHERE ChatToUser.userId = '{curr_user_id}'
                            LIMIT 1;""")
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_event_chat_id/<int:event_id>/', methods=['GET'])
def get_event_chat_id(event_id: int):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute(f"""SELECT chatId FROM Event
                                JOIN EventInfoToChat ON Event.eventInfoId = EventInfoToChat.eventInfoId
                                WHERE Event.id = {event_id}
                                LIMIT 1""")
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}
