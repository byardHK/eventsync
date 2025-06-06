import jwt
import requests
from flask import Flask, request, jsonify, Response, send_file, send_file
# INSTALL THESE:
# pip install mysql-connector-python
import mysql.connector
from flask_cors import CORS
from datetime import datetime, timedelta
from dateutil.relativedelta import *
import pusher
import os
import yagmail
import pillow_heif
from PIL import Image


app = Flask(__name__)
app.config["DEBUG"] = True
app.config["PROPAGATE_EXCEPTIONS"] = True  # Ensure exceptions are raised
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CORS(app, origins=["https://eventsync.gcc.edu", "https://eventsync.gcc.edu:443"])
#CORS(app, origins=["http://localhost:3000"])


db_config = {
    'host': '10.18.101.62',  
    'port': 3306,
    'user': 'jminnich1',
    'password': 'EventSync1!@',
    'database': 'event_sync'
}

GRAPH_API_URL = "https://graph.microsoft.com/v1.0/me"

cached_auth_info = { }

def get_authenticated_user():
    """Fetches the authenticated user's email from Microsoft Graph API."""

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        print("[AUTH ERROR] Missing Authorization header")
        return None, jsonify({"error": "Missing Authorization header"}), 403

    try:
        encodedJwt = auth_header[7:]
        print(f"[AUTH INFO] JWT received: {encodedJwt[:20]}...")  # Print only a slice for security
        jwtDecoder = jwt.JWT()
        decodedJwt = jwtDecoder.decode(encodedJwt, do_verify=False)
        print("[AUTH INFO] JWT decoded (unverified)")
    except Exception as e:
        print(f"[AUTH ERROR] JWT decoding failed: {e}")
        return None, jsonify({"error": "Invalid Authorization header"}), 403

    cached_info = cached_auth_info.get(auth_header)
    if cached_info:
        print("[CACHE HIT] Using cached user info")
    else:
        print("[CACHE MISS] Fetching from Microsoft Graph API")
        headers = {
            "Authorization": auth_header,
            "Accept": "application/json"
        }

        try:
            response = requests.get(GRAPH_API_URL, headers=headers)
            print(f"[GRAPH API] Response code: {response.status_code}")

            if response.status_code != 200:
                print(f"[GRAPH API ERROR] {response.text}")
                return None, jsonify({
                    "error": "Failed to fetch user profile",
                    "details": response.text
                }), 403

            cached_info = response.json()
            cached_auth_info[auth_header] = cached_info
            print(f"[GRAPH API] User profile cached")

        except Exception as e:
            print(f"[GRAPH API ERROR] Request failed: {e}")
            return None, jsonify({"error": "Failed to connect to Graph API"}), 500

    user_email = cached_info.get("mail")
    print(f"[USER INFO] Email fetched: {user_email}")

    if not user_email:
        print("[AUTH ERROR] Email not found in Graph response")
        return None, jsonify({"error": "Email not found in token response"}), 403

    return user_email, None, None  # Success

pusher_client = pusher.Pusher(
  app_id='1939690',
  key='d2b56055f7edd36cb4b6',
  secret='fc12eddbc27d54975d56',
  cluster='us2',
  ssl=True
)

@app.route('/api/update_user_profile', methods=['POST'])
def update_user_profile():
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
        email = data.get('userId')
        bio = data.get('bio')
        is_public = data.get('isPublic')
        event_cancelled = data.get('eventCancelled')
        profile_picture = data.get('profilePicture')

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
                eventCancelled = %s,
                profilePicture = %s
            WHERE id = %s
        """
        mycursor.execute(updateQuery, (
            bio, is_public, event_cancelled, profile_picture, email
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
    
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
   
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
        return error_response, status_code

    body = request.get_json()

    if not body or "email" not in body:
        return jsonify({"error": "Missing required 'email' field in request body"}), 400

    if body.get("email").lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        id = body.get("email")
        fname = body.get("firstName")
        lname = body.get("lastName")
        bio = body.get("bio", "")
        profilePicture = body.get("profilePicture", 0)
        is_public = int(body.get("isPublic", 0))
        is_banned = 0
        num_times_reported = int(body.get("numTimesReported", 0))
        notification_id = 1
        event_cancelled = int(body.get("eventCancelled", 0))
        gender = body.get("gender", "Undefined")
        is_admin = 0

        if not id or not fname or not lname:
            return jsonify({"error": "Missing required fields"}), 400

        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        sql = """
            INSERT INTO User (id, fname, lname, bio, profilePicture,
                isAdmin, isPublic, isBanned, numTimesReported, 
                notificationId, eventCancelled, gender) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            id, fname, lname, bio, profilePicture,
            is_admin, is_public, is_banned,
            num_times_reported, notification_id,
            event_cancelled, gender
        )

        mycursor.execute(sql, values)
        conn.commit()

        mycursor.close()
        conn.close()

        return jsonify({"message": "User added successfully"}), 201

    except mysql.connector.Error as err:
        print(f"[MYSQL ERROR] {err}")
        return jsonify({"error": "Database insert failed"}), 500

    except Exception as e:
        print(f"[UNEXPECTED ERROR] {e}")
        return jsonify({"error": "Unexpected error occurred"}), 500


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
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, EventInfo.description, EventInfo.creatorName, Event.views, Event.id, Event.eventInfoId, Event.numRsvps, EventInfo.RSVPLimit, EventInfo.isPublic, (
                            SELECT COUNT(*) FROM Event WHERE Event.eventInfoId = EventInfo.id ) AS recurs
                        from Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                     """)
        events_response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        events = [dict(zip(headers, row)) for row in events_response]

        for event in events:
            event_info_id = event['eventInfoId'] 

            query = """
                SELECT Tag.id, Tag.name
                FROM Tag
                JOIN EventInfoToTag ON Tag.id = EventInfoToTag.tagId
                WHERE EventInfoToTag.eventInfoId = %s
            """

            mycursor.execute(query, (event_info_id,))

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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code
    
    if not user_email:
        return jsonify({"error": "Missing required fields in request body"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        # check to see that it's the user's tag
        query = """ 
            select userId from Tag where id = %s;
        """
        mycursor.execute(query, (tagId,))
        result = mycursor.fetchone()

        owner_id = result[0]

        if owner_id.lower() != user_email.lower():
            mycursor.close()
            conn.close()
            print("here")
            return jsonify({"error": "Unauthorized: tag does not belong to user"}), 403

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
    selectedTags = body["selectedTags"]
    if len(selectedTags) == 0:
        return {}

    values = [(userId, tag["id"]) for tag in selectedTags]

    query = """
        INSERT INTO UserToTag (userId, tagId)
        VALUES (%s, %s)
    """

    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        mycursor.executemany(query, values)

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
        query = """
            DELETE FROM UserToTag WHERE (userId, tagId) IN %s;
        """
        mycursor.execute(query, values)
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

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
            SELECT Tag.id, Tag.name, Tag.userId FROM Tag INNER JOIN (
                SELECT UserToTag.tagId FROM UserToTag WHERE UserToTag.userId = %s
            ) AS UserToTag ON Tag.id = UserToTag.tagId;
        """
        mycursor.execute(query,(userId,))
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
        query = """
            SELECT Tag.id, Tag.name, Tag.userId FROM Tag INNER JOIN (
                SELECT EventInfoToTag.tagId FROM EventInfoToTag WHERE EventInfoToTag.eventInfoId = %s
            ) AS EventInfoToTag ON Tag.id = EventInfoToTag.tagId;
        """
        mycursor.execute(query,(eventInfoId,))
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if userId.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
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

@app.route('/is_friend/<user1Id>/<user2Id>/')
def is_friend(user1Id, user2Id):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if user1Id.lower() != user_email.lower() and user2Id.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        query = """
            SELECT u.id
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
            )
            AND id = %s;
        """
        mycursor.execute(query, (user1Id, user1Id, user2Id))
        response = mycursor.fetchall()
        result = len(response) > 0
        mycursor.close()
        conn.close()
        return jsonify({'isFriend': result})
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
        chatToUser = """
                INSERT INTO ChatToUser (chatId, userId) VALUES (%s, %s);
            """
        mycursor.execute(chatToUser, (chatId, friendId))
        mycursor.execute(chatToUser, (chatId, userId))

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

        # 1. Find 1-on-1 chats between the two users
        chat_id_query = """
            SELECT chatId
            FROM ChatToUser
            GROUP BY chatId
            HAVING COUNT(*) = 2 AND
                SUM(userId = %s OR userId = %s) = 2
        """
        mycursor.execute(chat_id_query, (userId, friendId))
        chat_ids = [row[0] for row in mycursor.fetchall()]

        for chat_id in chat_ids:
            # Clean up messages and uploads
            mycursor.execute("SELECT id FROM Message WHERE chatId = %s", (chat_id,))
            msg_ids = mycursor.fetchall()
            delete_uploads(msg_ids)  # your custom cleanup

            mycursor.execute("DELETE FROM Message WHERE chatId = %s", (chat_id,))
            mycursor.execute("DELETE FROM ChatToUser WHERE chatId = %s", (chat_id,))
            mycursor.execute("DELETE FROM Chat WHERE id = %s", (chat_id,))


        # Remove friendship
        delete_friend_query = """
            DELETE FROM UserToUser
            WHERE (user1Id = %s AND user2Id = %s) OR (user1Id = %s AND user2Id = %s)
        """
        mycursor.execute(delete_friend_query, (userId, friendId, friendId, userId))

        # Remove from each other's created groups
        remove_from_groups_query = """
            DELETE GOUTU FROM GroupOfUserToUser AS GOUTU
            JOIN GroupOfUser AS GOU ON GOUTU.groupId = GOU.id
            WHERE GOUTU.userId = %s AND GOU.creatorId = %s
        """
        mycursor.execute(remove_from_groups_query, (friendId, userId))
        mycursor.execute(remove_from_groups_query, (userId, friendId))

        conn.commit()
        mycursor.close()
        conn.close()

        return jsonify({"Message": "Friend removed successfully"}), 200

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Server error occurred"}), 500



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

         # make sure it's the creator who is signed in
        query = """  select ei.creatorId from Event e join EventInfo ei  on e.eventInfoId = ei.id where e.id = %s; """
        mycursor.execute(query, (eventId,))
        result = mycursor.fetchone()
        creatorId = result[0]
        if creatorId.lower() != user_email.lower():
            return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

        send_event_cancellation(eventId)

        setEventInfoId = "SET @eventInfoId = (SELECT eventInfoId FROM Event WHERE id = %s);"
        setChatId = "SET @chatId = (SELECT chatId FROM EventInfoToChat WHERE eventInfoId = @eventInfoId);"
        deleteEventInfoToChat = f"DELETE FROM EventInfoToChat WHERE eventInfoId = @eventInfoId"
        deleteChat = f"DELETE FROM Chat WHERE id = @chatId"
        mycursor.execute(setEventInfoId, (eventId,))
        mycursor.execute(setChatId)
        mycursor.execute(deleteEventInfoToChat)
        mycursor.execute(deleteChat)

        mycursor.execute("SELECT id FROM Message WHERE chatId = @chatId")
        msg_ids = mycursor.fetchall()
        delete_uploads(msg_ids)
        removeMessages = f"""
            DELETE FROM Message WHERE chatId = @chatId;
        """
        mycursor.execute(removeMessages)

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

        query = """  select ei.creatorId from Event e join EventInfo ei  on e.eventInfoId = ei.id where e.id = %s; """
        mycursor.execute(query, (eventId,))
        result = mycursor.fetchone()
        creatorId = result[0]
        if creatorId.lower() != user_email.lower():
            return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

        # send an email to all rsvps
        send_event_cancellation(eventId)

        # delete event
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

        query = """  select ei.creatorId from Event e join EventInfo ei  on e.eventInfoId = ei.id where e.id = %s; """
        mycursor.execute(query, (eventId,))
        result = mycursor.fetchone()
        creatorId = result[0]
        if creatorId.lower() != user_email.lower():
            return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

        mycursor.execute("""
                        SET @eventInfoId = (SELECT eventInfoId FROM Event WHERE id = %s);
                        
                     """, (eventId,))
        
        # send email notifications
        mycursor.execute(f"""
                        Select id FROM Event WHERE eventInfoId = @eventInfoId;
                    """)
        eventIds = [row[0] for row in mycursor.fetchall()]
        for eventId in eventIds:
            send_event_cancellation(eventId)
        
        setChatId = "SET @chatId = (SELECT chatId FROM EventInfoToChat WHERE eventInfoId = @eventInfoId);"
        deleteEventInfoToChat = f"DELETE FROM EventInfoToChat WHERE eventInfoId = @eventInfoId"
        deleteChat = f"DELETE FROM Chat WHERE id = @chatId"
        mycursor.execute(setChatId)
        mycursor.execute(deleteEventInfoToChat)
        mycursor.execute(deleteChat)

        mycursor.execute("SELECT id FROM Message WHERE chatId = @chatId")
        msg_ids = mycursor.fetchall()
        delete_uploads(msg_ids)
        removeMessages = f"""
            DELETE FROM Message WHERE chatId = @chatId;
        """
        mycursor.execute(removeMessages)
        
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

        insertEventInfo = """
            INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
            VALUES (%s, 0, %s, %s, %s, %s, %s, %s, %s, 0, %s, %s, %s, %s);
        """
        values = (
            data["creatorId"],
            data["title"],
            data["description"],
            data["locationName"],
            "",
            data["rsvpLimit"],
            data["isPublic"],
            data["isWeatherSensitive"],
            currentDateTime,
            data["venmo"],
            data["recurFrequency"],
            data["creatorName"]
        )
        mycursor.execute(insertEventInfo, values)
        eventInfoId = mycursor.lastrowid

        # Create chat for event
        createChat = """
            INSERT INTO Chat (name, chatType) VALUES (%s, 'Event');
        """
        mycursor.execute(createChat, (data["title"],))  # Make sure to pass as a tuple
        chatId = mycursor.lastrowid

        # Add relationship from chat to eventInfo
        addEventInfoToChat = """
            INSERT INTO EventInfoToChat (chatId, eventInfoId) 
            VALUES (%s, %s);
        """
        mycursor.execute(addEventInfoToChat, (chatId, eventInfoId))

        insertEvent = """
            INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
            VALUES (%s, %s, %s, %s, 0, 0);
        """
        mycursor.execute(insertEvent, (eventInfoId, db_startDateTime, db_endDateTime, currentDateTime))

        # Update tags
        tags = data["tags"]
        for tag in tags:
            updateTag = """
                UPDATE Tag
                SET numTimesUsed = numTimesUsed + 1
                WHERE name = %s;
            """
            mycursor.execute(updateTag, (tag["name"],))  # Ensure this is passed as a tuple

        mycursor.execute("SET @eventId = last_insert_id();")

        # Insert items for the event
        for item in data["items"]:
            insertItem = """
                INSERT INTO Item (name, creatorId)
                VALUES (%s, %s); 
            """
            mycursor.execute(insertItem, (item["description"], data["creatorId"]))  # Pass as tuple
            insertEventToItem = """
                INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                VALUES (@eventId, LAST_INSERT_ID(), %s, 0);
            """
            mycursor.execute(insertEventToItem, (item["amountNeeded"],))  # Pass as tuple

        # Insert tags to event info
        for tag in tags:
            updateTag = """
                INSERT INTO EventInfoToTag (eventInfoId, tagId)
                VALUES (%s, %s);
            """
            mycursor.execute(updateTag, (eventInfoId, tag["id"]))  # Pass as tuple

        conn.commit()
        mycursor.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        conn.close()
    return {}


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
        mycursor.execute("""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName, Event.views, (
                            SELECT COUNT(*) FROM Event WHERE Event.eventInfoId = EventInfo.id ) AS recurs
                        FROM Event
                        JOIN EventInfo 
                        ON Event.eventInfoId = EventInfo.id
                        WHERE EventInfo.creatorId = %s
                     """, (user_id,))
        response = mycursor.fetchall()
        headers = mycursor.description
        hosting_events = sqlResponseToList(response, headers)
        mycursor.execute("""
                        SELECT Event.startTime, Event.endTime, EventInfo.title as eventName, Event.id, EventInfo.locationName, Event.views
                        FROM Event
                        JOIN EventInfo
                        ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id IN (SELECT EventToUser.eventId FROM EventToUser WHERE EventToUser.userId = %s)
                     """, (user_id,))
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

        # Insert EventInfo into the database
        insertEventInfo = """
            INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
            VALUES (%s, 0, %s, %s, %s, "", %s, %s, %s, 0, %s, %s, %s, %s);
        """
        event_info_values = (
            data["creatorId"],
            data["title"],
            data["description"],
            data["locationName"],
            10,
            True,
            False,
            dateCreated,
            data["venmo"],
            data["recurFrequency"],
            data["creatorName"]
        )
        mycursor.execute(insertEventInfo, event_info_values)
        eventInfoId = mycursor.lastrowid
        mycursor.execute("SET @eventInfoId = last_insert_id();")

        # Create chat for event
        createChat = "INSERT INTO Chat (name, chatType) VALUES (%s, 'Event');"
        mycursor.execute(createChat, (data["title"],))
        chatId = mycursor.lastrowid

        # Add relationship from chat to eventInfo
        addEventInfoToChat = """
            INSERT INTO EventInfoToChat (chatId, eventInfoId) VALUES (%s, %s);
        """
        mycursor.execute(addEventInfoToChat, (chatId, eventInfoId))

        # Insert tags into EventInfoToTag table
        tags = data["tags"]
        for tag in tags:
            updateTag = """
                INSERT INTO EventInfoToTag(eventInfoId, tagId)
                VALUES (%s , %s);
            """
            mycursor.execute(updateTag, (eventInfoId, tag["id"]))

        # Get event dates through start date and end date
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
            insertItem = """
                INSERT INTO Item (name, creatorId)
                VALUES (%s, %s);
            """
            mycursor.execute(insertItem, (item["description"], data["creatorId"]))  
            mycursor.execute("SELECT LAST_INSERT_ID();")
            itemIds.append((mycursor.fetchone()[0], item))

        # Insert recurring events
        while curStartDate <= endDate:
            insertEvent = """
                INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
                VALUES (%s, %s, %s, %s, 0, 0);
            """
            mycursor.execute(insertEvent, (eventInfoId, curStartDate.strftime("%Y-%m-%d %H:%M:%S"), curEndDate.strftime("%Y-%m-%d %H:%M:%S"), dateCreated))
            mycursor.execute("SET @eventId = last_insert_id();")
            
            for el in itemIds:
                insertEventToItem = """
                    INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                    VALUES (@eventId, %s, %s, 0);
                """
                mycursor.execute(insertEventToItem, (el[0], el[1]["amountNeeded"]))

            if delta == "Daily":
                curStartDate += timedelta(days=1)
            elif delta == "Weekly":
                curStartDate += timedelta(weeks=1)
            elif delta == "Monthly":
                curStartDate = (curStartDate + relativedelta(months=1)).replace(day=1)  # first day of the next month
                curStartDate = curStartDate + relativedelta(weekday=dayOfWeek(nthWeekday))  # Adjust to the nth weekday
            else:
                return "Invalid recurring frequency", 400

            curEndDate = curStartDate + duration

            # Update tags usage count
            for tag in tags:
                updateTag = """
                    UPDATE Tag
                    SET numTimesUsed = numTimesUsed + 1
                    WHERE name = %s;
                """
                mycursor.execute(updateTag, (tag["name"],))

        conn.commit()
        mycursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        conn.close()
    
    return data, 201


@app.route('/get_event_creator_name/<string:user_id>/', methods=['GET'])
def get_user_name(user_id: str):
    try:  
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""SELECT CONCAT(fname, ' ', lname) AS fullName
                            FROM User
                            WHERE id = %s;""", (user_id,))
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
        mycursor.execute("""SELECT * FROM EventInfo WHERE id = %s""", (event_info_id,))
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
        mycursor.execute("""
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
                        WHERE Event.id = %s
                     """, (event_id,))
        response = mycursor.fetchall()
        headers = [x[0] for x in mycursor.description]
        event = dict(zip(headers, response[0]))

        mycursor.execute("""
                        SELECT Tag.id, Tag.name, Tag.userId
                        FROM Tag
                        JOIN EventInfoToTag ON Tag.id = EventInfoToTag.tagId
                        WHERE EventInfoToTag.eventInfoId = %s
                     """, (event['eventInfoId'],))
        tags_response = mycursor.fetchall()
        tags = [{
            "id": tag[0],
            "name": tag[1],
            "userId": tag[2]
        } for tag in tags_response]
        event['tags'] = tags

        mycursor.execute("""
                        SELECT Item.name, EventToItem.amountNeeded, EventToItem.quantitySignedUpFor, COALESCE(UserToItem.quantity, 0), Item.id 
                        FROM Item
                        JOIN EventToItem ON Item.id = EventToItem.itemId
                        LEFT OUTER JOIN (SELECT * FROM UserToItem 
                                        WHERE (userId, eventId) = (%s, %s)) 
                            AS UserToItem ON Item.id = UserToItem.itemId
                        WHERE EventToItem.eventId = %s
                     """, (user_id, event_id, event_id,))
        items_response = mycursor.fetchall()
        items = [{'name': item[0], 'amountNeeded': item[1], 'othersQuantitySignedUpFor': item[2] - item[3], 'myQuantitySignedUpFor': item[3], 'id': item[4]} for item in items_response]
        event['items'] = items

        mycursor.close()
        conn.close()
        return jsonify(event)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/get_events_by_eventInfoId/<int:eventInfoId>', methods=['GET'])
def get_events_by_eventInfoId(eventInfoId):
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  
    if not user_email:
        return jsonify({"error": "Unauthorized: Missing valid authenticated user"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor(dictionary=True)
        query = """
            SELECT Event.id, Event.startTime, Event.endTime, Event.eventInfoId, Event.views, Event.numRsvps
            FROM Event
            WHERE Event.eventInfoId = %s
            ORDER BY Event.startTime
        """
        mycursor.execute(query, (eventInfoId,))
        events = mycursor.fetchall()

        mycursor.close()
        conn.close()
        if not events:
            return jsonify({"error": "No events found for the given eventInfoId"}), 404
        return jsonify(events), 200
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database query failed"}), 500

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
        mycursor.execute("""
                        SELECT Event.eventInfoId, EventInfo.recurFrequency
                        FROM Event
                        JOIN EventInfo ON Event.eventInfoId = EventInfo.id
                        WHERE Event.id = %s
                    """, (eventId,))
        row = mycursor.fetchone()
        if not row:
            return jsonify({"error": "Event not found"}), 404
        eventInfoId, recurFrequency = row

        data = request.json

        startDateTime = data["startDateTime"]
        endDateTime = data["endDateTime"]

        db_startDateTime = datetime.strptime(startDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')
        db_endDateTime = datetime.strptime(endDateTime, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S')

        if (not recurFrequency or recurFrequency.lower() == "") and data["recurFrequency"] == "":
            # Update the single event details
            mycursor.execute("""
                UPDATE EventInfo
                SET title = %s,
                    description = %s,
                    locationName = %s,
                    RSVPLimit = %s,
                    isPublic = %s,
                    isWeatherDependant = %s,
                    venmo = %s
                WHERE id = %s
            """, (
                data["title"],
                data["description"],
                data["locationName"],
                data["rsvpLimit"],
                int(data["isPublic"]),
                int(data["isWeatherSensitive"]),
                data["venmo"],
                eventInfoId
            ))

            mycursor.execute("""
                UPDATE Event
                SET startTime = %s, endTime = %s
                WHERE id = %s
            """, (db_startDateTime, db_endDateTime, eventId))

            # Update items
            mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (eventId,))
            for item in data["items"]:
                mycursor.execute("INSERT INTO Item (name, creatorId) VALUES (%s, %s)", (item["description"], data["creatorId"]))
                mycursor.execute("SELECT LAST_INSERT_ID()")
                itemId = mycursor.fetchone()[0]
                mycursor.execute("""
                    INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                    VALUES (%s, %s, %s, 0)
                """, (eventId, itemId, item["amountNeeded"]))

            # Update tags
            mycursor.execute("DELETE FROM EventInfoToTag WHERE eventInfoId = %s", (eventInfoId,))
            for tag in data["tags"]:
                mycursor.execute("UPDATE Tag SET numTimesUsed = numTimesUsed + 1 WHERE name = %s", (tag["name"],))
                mycursor.execute("INSERT INTO EventInfoToTag(eventInfoId, tagId) VALUES (%s, %s)", (eventInfoId, tag["id"]))

            conn.commit()
            mycursor.close()
            conn.close()
            return jsonify({"message": "Single event updated successfully"})

        if data.get("editAllEvents"):
            eventInfoUpdate = """
                UPDATE EventInfo
                SET title = %s,
                    description = %s,
                    locationName = %s,
                    RSVPLimit = %s,
                    isPublic = %s,
                    isWeatherDependant = %s,
                    venmo = %s,
                    recurFrequency = %s
                WHERE id = %s;
            """
            eventInfoValues = (
                data["title"],
                data["description"],
                data["locationName"],
                data["rsvpLimit"],
                int(data["isPublic"]),
                int(data["isWeatherSensitive"]),
                data["venmo"],
                data["recurFrequency"],
                eventInfoId
            )
            mycursor.execute(eventInfoUpdate, eventInfoValues)

            reqStrFormat = '%Y-%m-%dT%H:%M:%S.%fZ'
            dateCreated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Fetch all existing events for the recurrence
            mycursor.execute("""
                SELECT id, startTime, endTime
                FROM Event
                WHERE eventInfoId = %s
                ORDER BY startTime
            """, (eventInfoId,))
            existing_events = mycursor.fetchall()

            # Use the first event in the series to determine the startDate
            if existing_events:
                first_event = existing_events[0]
                curStartDate = first_event[1]
                curEndDate = first_event[2]
            else:
                curStartDate = datetime.strptime(data["startDateTime"], reqStrFormat)
                curEndDate = datetime.strptime(data["endDateTime"], reqStrFormat)

            endDate = datetime.strptime(data["endRecurDateTime"], reqStrFormat) if data["endRecurDateTime"] else curEndDate
            delta = data["recurFrequency"]
            duration = curEndDate - curStartDate

            if delta == "Monthly":
                weekdays = [MO, TU, WE, TH, FR, SA, SU]
                dayOfWeek = weekdays[curStartDate.weekday()]
                nthWeekday = (curStartDate.day // 7) + 1

            itemIds = []
            for item in data["items"]:
                mycursor.execute("INSERT INTO Item (name, creatorId) VALUES (%s, %s)", (item["description"], "minnichjs21@gcc.edu"))
                mycursor.execute("SELECT LAST_INSERT_ID()")
                itemIds.append((mycursor.fetchone()[0], item))

            existing_event_index = 0
            while curStartDate <= endDate:
                if existing_event_index < len(existing_events):
                    existing_event = existing_events[existing_event_index]
                    mycursor.execute("""
                        UPDATE Event
                        SET startTime = %s, endTime = %s
                        WHERE id = %s
                    """, (curStartDate.strftime("%Y-%m-%d %H:%M:%S"), curEndDate.strftime("%Y-%m-%d %H:%M:%S"), existing_event[0]))
                    existing_event_index += 1
                else:
                    mycursor.execute("""
                        INSERT INTO Event (eventInfoId, startTime, endTime, eventCreated, views, numRsvps)
                        VALUES (%s, %s, %s, %s, 0, 0)
                    """, (eventInfoId, curStartDate.strftime("%Y-%m-%d %H:%M:%S"), curEndDate.strftime("%Y-%m-%d %H:%M:%S"), dateCreated))
                    mycursor.execute("SELECT LAST_INSERT_ID()")
                    new_event_id = mycursor.fetchone()[0]
                    for el in itemIds:
                        mycursor.execute("""
                            INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                            VALUES (%s, %s, %s, 0)
                        """, (new_event_id, el[0], el[1]["amountNeeded"]))

                if delta == "Daily":
                    curStartDate += timedelta(days=1)
                elif delta == "Weekly":
                    curStartDate += timedelta(weeks=1)
                elif delta == "Monthly":
                    curStartDate = (curStartDate + relativedelta(months=1)).replace(day=1)
                    curStartDate += relativedelta(weekday=dayOfWeek(nthWeekday))
                else:
                    return "Invalid recurring frequency", 400
                curEndDate = curStartDate + duration

            if existing_event_index < len(existing_events):
                for event in existing_events[existing_event_index:]:
                    mycursor.execute("DELETE FROM EventToItem WHERE eventId = %s", (event[0],))
                    mycursor.execute("DELETE FROM EventToUser WHERE eventId = %s", (event[0],))
                    mycursor.execute("DELETE FROM Event WHERE id = %s", (event[0],))

                mycursor.execute("DELETE FROM EventInfoToTag WHERE eventInfoId = %s", (eventInfoId,))
                for tag in data["tags"]:
                    mycursor.execute("UPDATE Tag SET numTimesUsed = numTimesUsed + 1 WHERE name = %s", (tag["name"],))
                    mycursor.execute("INSERT INTO EventInfoToTag(eventInfoId, tagId) VALUES (%s, %s)", (eventInfoId, tag["id"]))

            else:
                itemIds = []
                for item in data["items"]:
                    mycursor.execute("INSERT INTO Item (name, creatorId) VALUES (%s, %s)", (item["description"], "minnichjs21@gcc.edu"))
                    mycursor.execute("SELECT LAST_INSERT_ID()")
                    itemIds.append((mycursor.fetchone()[0], item))

                mycursor.execute("""
                    UPDATE Event
                    SET startTime = %s, endTime = %s
                    WHERE id = %s
                """, (db_startDateTime, db_endDateTime, eventId))

                for el in itemIds:
                    mycursor.execute("""
                        INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                        VALUES (%s, %s, %s, 0)
                    """, (eventId, el[0], el[1]["amountNeeded"]))

            mycursor.execute("DELETE FROM EventInfoToTag WHERE eventInfoId = %s", (eventInfoId,))
            for tag in data["tags"]:
                mycursor.execute("UPDATE Tag SET numTimesUsed = numTimesUsed + 1 WHERE name = %s", (tag["name"],))
                mycursor.execute("INSERT INTO EventInfoToTag(eventInfoId, tagId) VALUES (%s, %s)", (eventInfoId, tag["id"]))
        else:
            currentDateTime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            eventInfoInsert = """
                INSERT INTO EventInfo (creatorId, groupId, title, description, locationName, locationlink, RSVPLimit, isPublic, isWeatherDependant, numTimesReported, eventInfoCreated, venmo, recurFrequency, creatorName)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            eventInfoValues = (
                data["creatorId"], 0, data["title"], data["description"], data["locationName"], "",
                data["rsvpLimit"], int(data["isPublic"]), int(data["isWeatherSensitive"]), 0,
                currentDateTime, data["venmo"], data["recurFrequency"], data["creatorName"]
            )
            mycursor.execute(eventInfoInsert, eventInfoValues)
            eventInfoId = mycursor.lastrowid

            # Create chat for event
            createChat = """
                INSERT INTO Chat (name, chatType) VALUES (%s, 'Event');
            """
            mycursor.execute(createChat, (data["title"],))  # Make sure to pass as a tuple
            chatId = mycursor.lastrowid

            # Add relationship from chat to eventInfo
            addEventInfoToChat = """
                INSERT INTO EventInfoToChat (chatId, eventInfoId) 
                VALUES (%s, %s);
            """
            mycursor.execute(addEventInfoToChat, (chatId, eventInfoId))

            mycursor.execute("""
                UPDATE Event
                SET eventInfoId = %s, startTime = %s, endTime = %s
                WHERE id = %s
            """, (eventInfoId, db_startDateTime, db_endDateTime, eventId))

            itemIds = []
            for item in data["items"]:
                mycursor.execute("INSERT INTO Item (name, creatorId) VALUES (%s, %s)", (item["description"], data["creatorId"]))
                mycursor.execute("SELECT LAST_INSERT_ID()")
                itemIds.append((mycursor.fetchone()[0], item))

            for el in itemIds:
                mycursor.execute("""
                    INSERT INTO EventToItem (eventId, itemId, amountNeeded, quantitySignedUpFor)
                    VALUES (%s, %s, %s, 0)
                """, (eventId, el[0], el[1]["amountNeeded"]))

            mycursor.execute("DELETE FROM EventInfoToTag WHERE eventInfoId = %s", (eventInfoId,))
            for tag in data["tags"]:
                mycursor.execute("UPDATE Tag SET numTimesUsed = numTimesUsed + 1 WHERE name = %s", (tag["name"],))
                mycursor.execute("INSERT INTO EventInfoToTag(eventInfoId, tagId) VALUES (%s, %s)", (eventInfoId, tag["id"]))

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
           if data["quantity"] == 0:
            deleteUserToitem = """
                DELETE FROM UserToItem 
                WHERE (userId, eventId, itemId) = (%s, %s, %s)
            """
            mycursor.execute(deleteUserToitem, (
                data["userId"],
                data["eventId"],
                data["itemId"]
            ))
        else:
            updateUserToitem = """
                INSERT INTO UserToItem (userId, eventId, itemId, quantity) 
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE quantity = %s
            """
            mycursor.execute(updateUserToitem, (
                data["userId"],
                data["eventId"],
                data["itemId"],
                data["quantity"],
                data["quantity"]
            ))
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

        mycursor.execute("""
            SELECT EventInfo.RSVPLimit, Event.numRsvps
            FROM Event
            JOIN EventInfo ON Event.eventInfoId = EventInfo.id
            WHERE Event.id = %s
        """, (eventId,))
        result = mycursor.fetchone()
        rsvpLimit = result[0]
        numRsvps = result[1]

        if rsvpLimit != 0 and numRsvps >= rsvpLimit:
            return jsonify({"message": "RSVP limit reached"}), 400
        
        getLastMsgSeen = f"""SET @lastMsg = 
                            (SELECT MAX(lastMsgSeen) FROM EventToUser WHERE eventId IN 
                                (SELECT eventId FROM Event WHERE eventInfoId = 
                                    (SELECT eventInfoId WHERE id = {eventId})));"""
        mycursor.execute(getLastMsgSeen)
        insertRsvp = """
            INSERT INTO EventToUser (userId, eventId, lastMsgSeen)
            VALUES (%s, %s, @lastMsg);
        """
        mycursor.execute(insertRsvp, (userId, eventId))

        updateNumRsvps = """
            UPDATE Event
            SET numRsvps = numRsvps + 1
            WHERE id = %s;
        """
        mycursor.execute(updateNumRsvps, (eventId,))
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "RSVP successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/unrsvp', methods=['POST'])
def unrsvp():
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
        
        deleteRsvp = """
            DELETE FROM EventToUser
            WHERE userId = %s AND eventId = %s;
        """
        mycursor.execute(deleteRsvp, (userId, eventId))
        deleteItemSignUps = """
            DELETE FROM UserToItem
            WHERE userId = %s AND eventId = %s;
        """
        mycursor.execute(deleteItemSignUps, (userId, eventId))
        
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

        checkRsvp = """
            SELECT * FROM EventToUser
            WHERE userId = %s AND eventId = %s;
        """
        mycursor.execute(checkRsvp, (userId, eventId))
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

        mycursor.execute("""
                        SELECT User.id, User.fname, User.lname
                        FROM User
                        JOIN EventToUser ON User.id = EventToUser.userId
                        WHERE EventToUser.eventId = %s
                    """, (eventId,))
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
            """
            SELECT GroupOfUser.id, GroupOfUser.groupName, GroupOfUser.creatorId, GroupOfUser.chatId, GroupOfUser.numTimesReported
            FROM GroupOfUserToUser
            INNER JOIN GroupOfUser 
            ON GroupOfUserToUser.groupId = GroupOfUser.id 
            WHERE GroupOfUserToUser.userId = %s
            """, (userId,)
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

        # make sure they're an  admin
        admin_query = "SELECT isAdmin FROM User WHERE id = %s"
        mycursor.execute(admin_query, (user_email,))
        result = mycursor.fetchone()
        if not result or result[0] != 1: 
            # make sure the person is in the group if they're not an admin
            query = """
                SELECT * 
                FROM GroupOfUserToUser 
                WHERE groupId = %s AND userId = %s;
            """
            mycursor.execute(query, (groupId, user_email))
            result = mycursor.fetchone()
            print(result)

            if result is None:
                print("result is none")
                return jsonify({"error": "Unauthorized or invalid group/user association"}), 403

        # Get group info
        mycursor.execute(
            """
            SELECT * FROM GroupOfUser WHERE id = %s;
            """, (groupId,)
        )
        response = mycursor.fetchall()
        print(response)
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
        """
        SELECT User.id, User.fname, User.lname
        FROM GroupOfUserToUser
        INNER JOIN User 
        ON GroupOfUserToUser.userId = User.id 
        WHERE GroupOfUserToUser.groupId = %s;
        """, (group["id"],)
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
        removeGroupUsers = """
            DELETE FROM GroupOfUserToUser WHERE groupId = %s
        """
        mycursor.execute(removeGroupUsers, (groupId,))

        removeChatUsers = """
            DELETE ChatToUser FROM GroupOfUser JOIN ChatToUser ON GroupOfUser.chatId = ChatToUser.chatId WHERE GroupOfUser.id = %s;
        """
        mycursor.execute(removeChatUsers, (groupId,))

        add_users_to_group(users, groupId, mycursor)

        # Update name of group
        updateGroupName = """
            UPDATE GroupOfUser SET groupName = %s WHERE id = %s;
        """
        mycursor.execute(updateGroupName, (groupName, groupId))
        
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
        createChat = """
            INSERT INTO Chat (name, chatType) VALUES (%s, 'Group');
        """
        mycursor.execute(createChat, (groupName,))
        chatId = mycursor.lastrowid

        # Create group
        createGroup = """
           INSERT INTO GroupOfUser (groupName, creatorId, chatId, numTimesReported) VALUES (%s, %s, %s, %s);
        """
        mycursor.execute(createGroup, (groupName, creatorId, chatId, 0))
        groupId = mycursor.lastrowid

        # add relationship from chat to group 
        addGroupOfUserToChat = """
                INSERT INTO GroupOfUserToChat (chatId, groupOfUserId) VALUES (%s, %s);
            """
        mycursor.execute(addGroupOfUserToChat, (chatId, groupId))

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
    getChatId = "SELECT chatId, creatorId FROM GroupOfUser WHERE GroupOfUser.id = %s;"
    mycursor.execute(getChatId, (groupId,))
    response = mycursor.fetchone()
    chatId = response[0]
    creatorId = response[1]

    # Add each selected user to created group & group chat
    for user in users:
        addUserToGroup = """
            INSERT INTO GroupOfUserToUser (groupId, userId) VALUES (%s, %s);
        """
        mycursor.execute(addUserToGroup, (groupId, user["id"]))

@app.post('/remove_user_from_group')
def remove_user_from_group():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  
    
    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        currentUserId = body.get("currentUserId")
        groupId = body.get("groupId")

        removeUserFromGroup = """
            DELETE FROM GroupOfUserToUser WHERE userId = %s AND groupId = %s;
        """
        mycursor.execute(removeUserFromGroup, (currentUserId, groupId))

        removeUserFromGroupChat = """
            DELETE ChatToUser FROM GroupOfUser JOIN ChatToUser ON GroupOfUser.chatId = ChatToUser.chatId
            WHERE ChatToUser.userId = %s AND GroupOfUser.id = %s;
        """ 
        mycursor.execute(removeUserFromGroupChat, (currentUserId, groupId))
        
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "creation successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/delete_group')
def delete_group():
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

        groupId = body.get("groupId")

        # Remove reports related to the group
        removeReportsOfGroup = """
            DELETE FROM Report WHERE reportedGroupId = %s;
        """
        mycursor.execute(removeReportsOfGroup, (groupId,))

        # Get chatId associated with the groupId
        mycursor.execute("""
            SELECT chatId FROM GroupOfUserToChat WHERE groupOfUserId = %s;
        """, (groupId,))
        chat_id_result = mycursor.fetchone()

        if not chat_id_result:
            return jsonify({"error": "Group not found"}), 404
        
        chatId = chat_id_result[0]

        # Remove relationships in the GroupOfUserToChat table
        removeGroupOfUserToChat = """
            DELETE FROM GroupOfUserToChat WHERE groupOfUserId = %s;
        """
        mycursor.execute(removeGroupOfUserToChat, (groupId,))

        # Remove relationships in GroupOfUserToUser table
        removeGroupUsers = """
            DELETE FROM GroupOfUserToUser WHERE groupId = %s;
        """
        mycursor.execute(removeGroupUsers, (groupId,))

        # Remove group information from GroupOfUser table
        removeGroup = """
            DELETE FROM GroupOfUser WHERE id = %s;
        """
        mycursor.execute(removeGroup, (groupId,))

        # Remove the chat
        removeChat = """
            DELETE FROM Chat WHERE id = %s;
        """
        mycursor.execute(removeChat, (chatId,))

        # Delete associated messages
        mycursor.execute("SELECT id FROM Message WHERE chatId = %s", (chatId,))
        msg_ids = mycursor.fetchall()
        delete_uploads(msg_ids)

        # Remove the messages
        removeMessages = """
            DELETE FROM Message WHERE chatId = %s;
        """
        mycursor.execute(removeMessages, (chatId,))

        conn.commit()
        mycursor.close()
        conn.close()

        return jsonify({"message": "Group deleted successfully"})
    
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return jsonify({"error": "Database error"}), 500

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

        mycursor.execute(""" 
            SELECT eventInfoId FROM Event WHERE id = %s;
        """, (eventId,))
        eventInfoId = mycursor.fetchone()[0]

        reportEvent = """
            INSERT INTO Report (details, reportedBy, reportedEventInfoId)
            VALUES (%s, %s, %s);
        """
        mycursor.execute(reportEvent, (eventDetails, eventReportedBy, eventInfoId))
        
        incrementNumTimesReported = """
            UPDATE (EventInfo JOIN User ON EventInfo.creatorId = User.id) SET User.numTimesReported = User.numTimesReported+1 WHERE EventInfo.id = %s;
        """
        mycursor.execute(incrementNumTimesReported, (eventInfoId,))

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

        mycursor.execute(""" 
            SELECT id FROM GroupOfUser WHERE id = %s;
        """, (groupId,))
        reportedGroupId = mycursor.fetchone()[0]

        reportGroup = """
            INSERT INTO Report (details, reportedBy, reportedGroupId)
            VALUES (%s, %s, %s);
        """
        mycursor.execute(reportGroup, (groupDetails, groupReportedBy, reportedGroupId))

        incrementNumTimesReported = """
            UPDATE (GroupOfUser JOIN User ON GroupOfUser.creatorId = User.id) SET User.numTimesReported = User.numTimesReported+1 WHERE GroupOfUser.id = %s;
        """
        mycursor.execute(incrementNumTimesReported, (reportedGroupId,))

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

        reportMessage = """
            INSERT INTO Report (details, reportedBy, reportedMessageId)
            VALUES (%s, %s, %s);
        """
        mycursor.execute(reportMessage, (messageDetails, messageReportedBy, messageId))

        incrementNumTimesReported = """
            UPDATE (Message JOIN User ON Message.senderId = User.id) SET User.numTimesReported = User.numTimesReported+1 WHERE Message.id = %s;
        """
        mycursor.execute(incrementNumTimesReported, (messageId,))

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

        reportUser = """
            INSERT INTO Report (details, reportedBy, reportedUserId)
            VALUES (%s, %s, %s);
        """
        mycursor.execute(reportUser, (userDetails, userReportedBy, userId))

        
        incrementNumTimesReported = """
            UPDATE User SET User.numTimesReported = User.numTimesReported+1 WHERE User.id = %s;
        """
        mycursor.execute(incrementNumTimesReported, (userId,))

        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"message": "report successful"})
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.post('/delete_report')
def delete_report():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code 
    
    if not user_email:
        return jsonify({"error": "Unauthorized: Missing valid authenticated user"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json
        reportId = body.get("reportId")

        # make sure user is an admin!
        query = """
                SELECT isAdmin FROM User WHERE id = %s
        """

        mycursor.execute(query, (user_email,))
        result = mycursor.fetchone()
        isAdmin = result[0]
        print("isAdmin ", isAdmin)
        if(isAdmin == 0):
           return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

        removeGroupUsers = """
            DELETE FROM Report WHERE id = %s;
        """
        mycursor.execute(removeGroupUsers, (reportId,))

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
    
    if not user_email:
        return jsonify({"error": "Unauthorized: Missing valid authenticated user"}), 403

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        body = request.json

        # make sure user is an admin!
        query = """
                SELECT isAdmin FROM User WHERE id = %s
        """

        mycursor.execute(query, (user_email,))
        result = mycursor.fetchone()
        isAdmin = result[0]
        print("isAdmin ", isAdmin)
        if(isAdmin == 0):
           return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

        reportedUserId = body.get("reportedUserId")
        warningMessage = body.get("warningMessage")
        timeSent = body.get("timeSent")

        #Try to find a chat between the warner and the warnee exclusively
        usersInWarnChat = 2
        if user_email.lower() == reportedUserId:
            usersInWarnChat = 1

        getChatIdBetweenUsers = """
            SELECT Chat.chatId FROM (
                SELECT Chat.id AS chatId, COUNT(ChatToUser.userId) AS userCount FROM ChatToUser JOIN (
                    SELECT Chat.id FROM Chat JOIN ChatToUser ON Chat.id = ChatToUser.chatId WHERE Chat.chatType = "Individual" GROUP BY Chat.id HAVING COUNT(ChatToUser.userId) = %s
                ) AS Chat ON Chat.id = ChatToUser.chatId WHERE ChatToUser.userId = %s OR ChatToUser.userId = %s GROUP BY Chat.id
            ) AS Chat WHERE Chat.userCount = %s;
        """
        mycursor.execute(getChatIdBetweenUsers, (usersInWarnChat, user_email.lower(), reportedUserId, usersInWarnChat))
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

            addWarnerToWarnChat = """
                INSERT INTO ChatToUser (chatId, userId) VALUES (%s, %s);
            """
            mycursor.execute(addWarnerToWarnChat, (warnChatId, user_email.lower()))

            if usersInWarnChat == 2:
                addWarneeToWarnChat = """
                    INSERT INTO ChatToUser (chatId, userId) VALUES (%s, %s);
                """
                mycursor.execute(addWarneeToWarnChat, (warnChatId, reportedUserId))

        # Finally, we will post an automated message from the warner to the group chat with the warnee.
        createWarningMessage = """
            INSERT INTO Message (chatId, senderId, messageContent, timeSent) 
                VALUES (%s, %s, %s, %s);
        """
        mycursor.execute(createWarningMessage, (warnChatId, user_email.lower(), warningMessage, timeSent))

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
        
        date = datetime.strptime(data['timeSent'], "%Y-%m-%d %H:%M:%S")
        dateToStore = (date + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")

        query = """
            INSERT INTO Message (chatId, senderId, messageContent, timeSent)
            VALUES (%s, %s, %s, %s);
        """

        # Execute the query with parameters
        mycursor.execute(query, (data['chatId'], data['senderId'], data['messageContent'], dateToStore))
        msgId = mycursor.lastrowid
        conn.commit()
        mycursor.close()
        conn.close()
        pusher_client.trigger(f'chat-{data["chatId"]}', 'new-message', {'messageContent': data['messageContent'], 'senderId': data['senderId'],
                                    'chatId': data['chatId'], 'timeSent': data['timeSent'], 'id': msgId}) # TODO: change id
        return "message sent"
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.get('/get_message/<int:message_id>')
def get_message(message_id: int):
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("SELECT * FROM Message WHERE id = %s", (message_id,))
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
        print(error_response)
        return error_response, status_code  

    if not user_email:
        print("no user email")
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        accessGranted = False

        query = "SELECT chatType FROM Chat WHERE id = %s"
        mycursor.execute(query, (chat_id,))
        result = mycursor.fetchone()
        print("CHAT TYPE --------")
        print(result)
        print("----------------")

        if result and result[0] == "Event":
            print("access granted")
            accessGranted = True

        if(accessGranted == False):
            query = "SELECT * FROM ChatToUser WHERE chatId = %s AND userId = %s"
            mycursor.execute(query, (chat_id, user_email))
            result = mycursor.fetchone()
            print("CHAT --------")
            print(result)
            print("----------------")

            if(result != None):
                print("access granted")
                accessGranted = True

        if(accessGranted == False):
            query =  """SELECT * FROM GroupOfUserToUser
                JOIN GroupOfUserToChat ON GroupOfUserToUser.groupId = GroupOfUserToChat.groupOfUserId
                WHERE GroupOfUserToChat.chatId = %s AND GroupOfUserToUser.userId = %s"""
            mycursor.execute(query, (chat_id, user_email))
            result = mycursor.fetchone()
            print("GROUP CHAT --------")
            print(result)
            print("----------------")

            if(result != None):
                accessGranted = True


        print("access granted", accessGranted)
        if(accessGranted):
        
            mycursor.execute("SELECT * FROM Message WHERE chatId = %s", (chat_id,))
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
        query = """
        SELECT * FROM
        ((
            SELECT Chat.id AS myChatId, groupStuff.groupName AS name, Chat.chatType, 
                groupStuff.lastMsgId, groupStuff.unreadMsgs
            FROM Chat
            JOIN (
                SELECT GroupOfUser.chatId, GroupOfUser.groupName, 
                    msg.lastMsgId,
                    GroupOfUserToUser.lastMsgSeen < msg.lastMsgId AS unreadMsgs 
                FROM GroupOfUserToChat
                JOIN GroupOfUserToUser ON GroupOfUserToChat.groupOfUserId = GroupOfUserToUser.groupId
                JOIN GroupOfUser ON GroupOfUserToChat.groupOfUserId = GroupOfUser.id
                JOIN (
                    SELECT chatId, MAX(id) AS lastMsgId FROM Message GROUP BY chatId
                ) AS msg ON msg.chatId = GroupOfUserToChat.chatId
                WHERE GroupOfUserToUser.userId = %s
            ) AS groupStuff ON Chat.id = groupStuff.chatId 
            WHERE Chat.chatType = 'Group'
        )
        UNION
        (
            SELECT Chat.id AS myChatId, CONCAT(otherUser.fname, ' ', otherUser.lname) AS name, Chat.chatType, 
                msg.lastMsgId, 
                msg.lastMsgId IS NOT NULL AND msg.lastMsgId > 0 AND currUser.lastMsgSeen < msg.lastMsgId AS unreadMsgs
            FROM Chat 
            JOIN ChatToUser AS currUser ON Chat.id = currUser.chatId
            LEFT JOIN (
                SELECT chatId, MAX(id) AS lastMsgId FROM Message GROUP BY chatId
            ) AS msg ON msg.chatId = currUser.chatId
            JOIN (
                SELECT ChatToUser.chatId, ChatToUser.lastMsgSeen, User.fname, User.lname
                FROM ChatToUser 
                JOIN User ON ChatToUser.userId = User.id
                WHERE ChatToUser.userId != %s
            ) AS otherUser ON currUser.chatId = otherUser.chatId
            WHERE currUser.userId = %s AND Chat.chatType = 'Individual'
        )
        UNION
        (
            SELECT Chat.id AS myChatId, EventInfo.title AS name, Chat.chatType, msg.lastMsgId, 
                msg.lastMsgId > 0 AND EventToUser.lastMsgSeen < msg.lastMsgId AS unreadMsgs
            FROM Chat
            JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
            JOIN Event ON Event.eventInfoId = EventInfoToChat.eventInfoId
            JOIN EventToUser ON EventToUser.eventId = Event.id
            JOIN EventInfo ON EventInfo.id = EventInfoToChat.eventInfoId
            LEFT JOIN (
                SELECT chatId, MAX(id) AS lastMsgId FROM Message GROUP BY chatId
            ) AS msg ON msg.chatId = Chat.id
            WHERE EventToUser.userId = %s AND EventInfo.creatorId != %s
                AND Chat.chatType = 'Event'
        )
        UNION
        (
            SELECT Chat.id AS myChatId, event.title AS name, Chat.chatType, msg.lastMsgId,
                msg.lastMsgId IS NOT NULL AND (
                    event.creatorLastMsgSeen IS NULL OR
                    (msg.lastMsgId > 0 AND event.creatorLastMsgSeen < msg.lastMsgId)
                ) AS unreadMsgs 
            FROM Chat
            JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
            LEFT JOIN (
                SELECT chatId, MAX(id) AS lastMsgId FROM Message GROUP BY chatId
            ) AS msg ON msg.chatId = EventInfoToChat.chatId
            JOIN (
                SELECT Event.eventInfoId, Event.creatorLastMsgSeen, EventInfo.title, EventInfo.creatorId 
                FROM Event 
                JOIN EventInfo ON EventInfo.id = Event.eventInfoId 
                WHERE EventInfo.creatorId = %s
            ) AS event ON event.eventInfoId = EventInfoToChat.eventInfoId
            WHERE Chat.chatType = 'Event'
        )) as chats
        LEFT JOIN Message ON Message.id = chats.lastMsgId
        """

        mycursor.execute(query, (user_id, user_id, user_id, user_id, user_id, user_id))

        response = mycursor.fetchall()
        print(response)
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        
        return sqlResponseToJson(response, headers)
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
        
        accessGranted = False

        query = "SELECT chatType FROM Chat WHERE id = %s"
        mycursor.execute(query, (chat_id,))
        result = mycursor.fetchone()
        print("CHAT TYPE --------")
        print(result)
        print("----------------")

        if result and result[0] == "Event":
            print("access granted")
            accessGranted = True

        if(accessGranted == False):
            query = "SELECT * FROM ChatToUser WHERE chatId = %s AND userId = %s"
            mycursor.execute(query, (chat_id, user_email))
            result = mycursor.fetchone()
            print("CHAT --------")
            print(result)
            print("----------------")

            if(result != None):
                print("access granted")
                accessGranted = True

        if(accessGranted == False):
            query =  """SELECT * FROM GroupOfUserToUser
                JOIN GroupOfUserToChat ON GroupOfUserToUser.groupId = GroupOfUserToChat.groupOfUserId
                WHERE GroupOfUserToChat.chatId = %s AND GroupOfUserToUser.userId = %s"""
            mycursor.execute(query, (chat_id, user_email))
            result = mycursor.fetchone()
            print("GROUP CHAT --------")
            print(result)
            print("----------------")

            if(result != None):
                accessGranted = True
        print("access granted", accessGranted)
        if(accessGranted):
            mycursor.execute("""(SELECT Chat.id, GroupOfUser.groupName AS name, Chat.chatType FROM Chat
                                JOIN GroupOfUser ON GroupOfUser.chatId = Chat.id 
                                WHERE Chat.id = %s)
                                UNION 
                                (SELECT Chat.id, EventInfo.title AS name, Chat.chatType FROM Chat
                                JOIN EventInfoToChat ON Chat.id = EventInfoToChat.chatId
                                JOIN EventInfo ON EventInfo.id = EventInfoToChat.eventInfoId
                                WHERE Chat.id = %s)
                                UNION
                                (SELECT Chat.id, "" AS name, Chat.chatType FROM Chat 
                                JOIN ChatToUser ON Chat.id = ChatToUser.chatId
                                WHERE Chat.id = %s)
                                LIMIT 1""", (chat_id, chat_id, chat_id))
            response = mycursor.fetchall()
            headers = mycursor.description
            chat = sqlResponseToList(response, headers)[0]
            mycursor.execute("""(SELECT id, fname, lname FROM User
                                    JOIN GroupOfUserToUser ON User.id = GroupOfUserToUser.userId
                                    JOIN GroupOfUserToChat ON GroupOfUserToUser.groupId = GroupOfUserToChat.groupOfUserId
                                    WHERE GroupOfUserToChat.chatId = %s)
                                UNION
                                (SELECT User.id, fname, lname FROM User
                                    JOIN EventToUser ON User.id = EventToUser.userId
                                    JOIN Event ON EventToUser.eventId = Event.id
                                    JOIN EventInfoToChat ON EventInfoToChat.eventInfoId = Event.eventInfoId
                                    WHERE EventInfoToChat.chatId = %s)
                                UNION
                                (SELECT id, fname, lname 
                                    FROM User WHERE id IN (
                                    SELECT userId FROM ChatToUser
                                    WHERE chatId = %s))""", (chat_id, chat_id, chat_id))
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
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if curr_user_id.lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403
    
    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("""SELECT ChatToUser.chatId FROM ChatToUser 
                            JOIN (SELECT * FROM ChatToUser WHERE userId = %s) AS otherUserTable
                            ON ChatToUser.chatId = otherUserTable.chatId
                            WHERE ChatToUser.userId = %s
                            LIMIT 1;""", (other_user_id, curr_user_id))
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
        mycursor.execute("""SELECT chatId FROM Event
                                JOIN EventInfoToChat ON Event.eventInfoId = EventInfoToChat.eventInfoId
                                WHERE Event.id = %s
                                LIMIT 1""", (event_id,))
        response = mycursor.fetchall()
        headers = mycursor.description
        conn.commit()
        mycursor.close()
        conn.close()
        return sqlResponseToJson(response, headers)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

@app.route('/update_msg_last_seen/', methods=['POST'])
def update_msg_last_seen():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  

    if request.json["user_id"].lower() != user_email.lower():
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403

    try:
        body = request.json
        user_id = body["user_id"]
        chat_id = body["chat_id"]
        msg_id = body["msg_id"]
        chat_type = body["chat_type"]
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()

        if chat_type == 'Group':
            mycursor.execute("""UPDATE GroupOfUserToUser 
                             SET lastMsgSeen = %s
                             WHERE groupId = (SELECT groupOfUserId FROM GroupOfUserToChat WHERE groupOfUserId = 
                                (SELECT groupOfUserId FROM GroupOfUserToChat WHERE chatId = %s))
                            AND userId = %s""", (msg_id, chat_id, user_id))
        elif chat_type == 'Individual':
            mycursor.execute("""UPDATE ChatToUser 
                             SET lastMsgSeen = %s
                             WHERE chatId = %s AND userId = %s""", (msg_id, chat_id, user_id))
        elif chat_type == 'Event':
            mycursor.execute(f"""SET @eventInfoId = (SELECT eventInfoId FROM EventInfoToChat
                                WHERE chatId = {chat_id});""")
            mycursor.execute(f"""SELECT creatorId FROM EventInfo WHERE id = @eventInfoId""")
            response = mycursor.fetchall()
            headers = mycursor.description
            creatorList = sqlResponseToList(response, headers)
            eventCreator = creatorList[0]["creatorId"]
            userIsCreator = (eventCreator.lower() == user_email.lower())

            mycursor.execute(f"""SELECT id FROM Event WHERE eventInfoId = @eventInfoId""")
            response = mycursor.fetchall()
            headers = mycursor.description
            events = sqlResponseToList(response, headers)
            for event in events:
                eventId = event["id"]
                if userIsCreator:
                    mycursor.execute(f"""UPDATE Event
                                    SET Event.creatorLastMsgSeen = {msg_id}
                                    WHERE id = {eventId}""") 
                else:
                    mycursor.execute(f"""UPDATE EventToUser
                                        SET EventToUser.lastMsgSeen = {msg_id}
                                        WHERE eventId = {eventId} AND userId = '{user_id}'""")
        else:
            return "Invalid chat type", 404

        conn.commit()
        mycursor.close()
        conn.close()
        return "Successfully update rows", 201
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    return {}

from flask import request, jsonify
import mysql.connector

@app.route('/ban_user', methods=['POST'])
def ban_user():
    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code
    
    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403  

    try:
        conn = mysql.connector.connect(**db_config)
        mycursor = conn.cursor()
        mycursor.execute("SELECT isAdmin FROM User WHERE id = %s", (user_email,))
        response = mycursor.fetchone()
        
        if not response or response[0] != 1: 
            return jsonify({"error": "Unauthorized: You must be an admin to perform this action"}), 403

        data = request.get_json()
        user_id_to_ban = data.get("userId")

        if not user_id_to_ban:
            return jsonify({"error": "Missing userId in request"}), 400

        mycursor.execute("UPDATE User SET isBanned = 1 WHERE id = %s", (user_id_to_ban,))
        conn.commit()
        mycursor.close()
        conn.close()
        return jsonify({"success": f"User {user_id_to_ban} has been banned"}), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500


@app.route('/upload/', methods=['POST'])
def upload():

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code  
    
    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403  

    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        data = request.form
        try:
            conn = mysql.connector.connect(**db_config)
            mycursor = conn.cursor()

            date = datetime.strptime(data['timeSent'], "%Y-%m-%d %H:%M:%S")
            dateToStore = (date + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")

            mycursor.execute("""
                INSERT INTO Message (chatId, senderId, imagePath, timeSent)
                VALUES (%s, %s, %s, %s)
            """, (data.get('chatId'), data.get('senderId'), data.get('imageType'), dateToStore))

            messageId = mycursor.lastrowid
            conn.commit()
            mycursor.close()
            conn.close()

            type = data.get('imageType')

            if(data.get('imageType') == 'image/png'):
                filename = str(messageId) + '.png'
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
            elif(data.get('imageType') == 'image/jpeg'):
                filename = str(messageId) + '.jpg'
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
            else: 
                heif_file = pillow_heif.read_heif(file)
                image = Image.frombytes(
                    heif_file.mode,
                    heif_file.size,
                    heif_file.data,
                    "raw",
                )
                filename = str(messageId) + '.jpg'
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image.save(file_path, format("jpeg"))
                type = 'image/jpeg'
            
            pusher_client.trigger(f'chat-{data.get("chatId")}', 'new-message', {'imagePath': type, 'senderId': request.form.get('senderId'),
                    'chatId': request.form.get('chatId'), 'timeSent': request.form.get('timeSent'), 'id': messageId})
            return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200

        except mysql.connector.Error as err:
            print(f"Error: {err}")
    return {}

@app.route('/get_image/<int:message_id>/', methods=['GET'])
def get_image(message_id: int):

    user_email, error_response, status_code = get_authenticated_user()
    if error_response:
        return error_response, status_code

    if not user_email:
        return jsonify({"error": "Unauthorized: userId does not match token email"}), 403    
   
    try:
        if os.path.exists(f"uploads/{message_id}.jpg"):
            return send_file(f"uploads/{message_id}.jpg", mimetype='image/jpeg'), 200
        elif os.path.exists(f"uploads/{message_id}.png"):
            return send_file(f"uploads/{message_id}.png", mimetype='image/png'), 200
        else:
            return "No image found", 404
    except Exception as  e:
        print(f"Error: {e}")
        return {}, 404
    
def delete_uploads(msg_ids):
    for msg_arr in msg_ids:
        msg_id = msg_arr[0]
        img_paths = [f"uploads/{msg_id}.jpg", f"uploads/{msg_id}.png"]
        for path in img_paths:
            if os.path.exists(path):
                os.remove(path)

def send_event_cancellation(event_id):
    conn = mysql.connector.connect(**db_config)
    mycursor = conn.cursor()
    
    # Fetch RSVP'd users
    mycursor.execute("""
        SELECT User.id
        FROM User
        JOIN EventToUser ON User.id = EventToUser.userId
        WHERE EventToUser.eventId = %s
    """, (event_id,))      
    rsvp_emails = [row[0] for row in mycursor.fetchall()]
    
    # Fetch event details
    mycursor.execute("""
        SELECT EventInfo.title, Event.startTime, Event.endTime
        FROM Event
        JOIN EventInfo ON Event.eventInfoId = EventInfo.id
        WHERE Event.id = %s
    """, (event_id,))
    
    response = mycursor.fetchone()
    
    if not response:
        return jsonify({"error": "Event not found"}), 404
    
    headers = [x[0] for x in mycursor.description]
    event = dict(zip(headers, response))
    
    yag = yagmail.SMTP("noreplyeventsync@gmail.com", "ktlo jynx tzpy jxok")
    for email in rsvp_emails:

        # get first name
        mycursor.execute("""
        select fname from User where id = %s
        """, (email,))
    
        first_name = mycursor.fetchone()

        subject = "Event Cancelled"
        event_start_time = event['startTime'] 
        formatted_time = event_start_time.strftime("%A, %B %d, %Y at %I:%M %p")
        
        # Email Body
        body = f"""
        Dear {first_name[0]},

        This is a notification to let you know that {event['title']}, originally scheduled for {formatted_time}, has been cancelled.
        
        We apologize for any inconvenience.
        
        Best regards,

        EventSync Team
        """
        
        # Send emails
        yag.send(email, subject, body)


