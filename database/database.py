import os, enum
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

scriptdir = os.path.dirname(os.path.abspath(__file__))
dbfile = os.path.join(scriptdir, "eventsync.sqlite3")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{dbfile}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)



class User(db.Model):
	__tablename__ = 'Users'
	email = db.Column(db.Unicode, primary_key=True)
	fname = db.Column(db.Unicode, nullable=False)
	lname = db.Column(db.Unicode, nullable=False)
	
class Friend(db.Model):
	__tablename__ = 'Friends'
	user1 = db.Column(db.Unicode, db.ForeignKey(User.email), primary_key=True)
	user2 = db.Column(db.Unicode, db.ForeignKey(User.email), primary_key=True)
	isFriend = db.Column(db.Boolean, nullable=False)
	
class ReportType(enum.Enum):
    user = 1
    event = 2
    group =3

class Report(db.Model):
    tablename = 'Reports'
    id = db.Column(db.Integer, primary_key=True)
    reportedBy = db.Column(db.Text, nullable=False)
    reportedUser = db.Column(db.Text, nullable=False)
    numReports = db.Column(db.Integer, nullable=False)
    details = db.Column(db.Text, nullable=False)
    contentID = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum(ReportType), nullable=False)
    date = db.Column(db.Text, nullable=False)

class Profile(db.Model):
    __tablename__ = 'Profile'
    id = db.Column(db.Integer, primary_key=True)
    isPublic = db.Column(db.Boolean, nullable=False)
    profilePicture= db.Column(db.Unicode, nullable=False)
    bio = db.Column(db.Unicode, nullable=False)
    digestFrequency = db.Column(db.Integer, nullable=False)
    customTags = db.Column(db.Unicode, nullable=False)
    notifications = db.relationship('Notifications', backref='profile')
    # tags = db.relationship('Tags', backref='profile')
    # user = db.relationship('User', backref='profile')


class Group(db.Model):
    __tablename__ = 'Group'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode, nullable=False)
    numTimesReported = db.Column(db.Integer, nullable=False)
    # chat = db.relationship('Chat', backref='group')
    # user = db.relationship('User', backref='group')

class Event(db.Model):
    tablename = 'Event'
    id = db.Column(db.Integer, primary_key=True)
    groupId = db.Column(db.Integer, nullable = False)
    timesReported = db.Column(db.Integer, nullable = False)
    startDate = db.Column(db.DateTime, nullable=False)
    endDate = db.Column(db.DateTime, nullable=False)

class Item(db.Model):
    __tablename__ = 'Item'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.Unicode, nullable=False)
    amountNeeded = db.Column(db.Integer, nullable=False)
    quantityAccountFor = db.Column(db.Integer, nullable=False)
    isFull = db.Column(db.Boolean, nullable=False)
    event = db.Column(db.Integer, db.ForeignKey(Event.id))

class UserItem(db.Model):
    __tablename__ = 'UserItem'
    item = db.Column(db.Integer, db.ForeignKey(Item.id), primary_key=True)
    user = db.Column(db.Unicode, db.ForeignKey(User.email), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)

class EventInfo(db.Model):
  tablename = 'EventInfo'
  id = db.Column(db.Integer, primary_key=True)
  title = db.Column(db.Unicode, nullable=False)
  description = db.Column(db.Unicode, nullable=False)
  location = db.Column(db.Unicode, nullable=False)
  RSVPlimit = db.Column(db.Integer, nullable=False)
  isPrivate = db.Column(db.Boolean, nullable=False)
  isWeatherDependent = db.Column(db.Boolean, nullable=False)
  numTimesReported = db.Column(db.Integer, nullable=False)

class EventToEventInfo(db.Model):
   tablename = 'EventToEventInfo'
   eventId = db.Column(db.Integer, db.ForeignKey(Event.id), primary_key=True)
   eventInfoId = db.Column(db.Integer, db.ForeignKey(EventInfo.id), primary_key=True)

class Tag(db.Model):
    tablename = 'Tag'
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Text, nullable=False)
    owner = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.Integer, nullable=False)

class TagToEventInfo(db.Model):
   tablename = 'EventToEventInfo'
   tag = db.Column(db.Integer, db.ForeignKey(Tag.id), primary_key=True)
   eventInfo = db.Column(db.Integer, db.ForeignKey(EventInfo.id), primary_key=True)

class Chat(db.Model):
    tablename = 'Chats'
    id = db.Column(db.Integer, primary_key=True)

class Message(db.Model):
    __tablename__ = 'Messages'
    id = db.Column(db.Integer, primary_key=True)
    isReported = db.Column(db.Boolean, nullable=False)
    senderEmail = db.Column(db.Unicode, db.ForeignKey(User.email),)
    timeSent = db.Column(db.Unicode, nullable=False)
    chat = db.Column(db.Integer, db.ForeignKey(Chat.id))

class NotificationType(enum.Enum):
    eventInvite = 1
    receiveFriendRequest = 2
    eventCancellation = 3

class Notifications(db.Model):
    __tablename__ = 'Notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Unicode, nullable=False)
    dateTime = db.Column(db.DateTime)
    linkToEvent = db.Column(db.Unicode, nullable=True)
    linkToUser = db.Column(db.Unicode, nullable=True)
    profileId = db.Column(db.Unicode, db.ForeignKey(Profile.id), primary_key=True)
    type = db.Column(db.Enum(NotificationType), nullable=False)

with app.app_context():
    db.drop_all()
    db.create_all()
	
    users = [
		User(email="1", fname="f", lname="l"),
		User(email="2", fname="f", lname="l"),
		User(email="3", fname="f", lname="l"),
		User(email="4", fname="f", lname="l"),
		Friend(user1="1", user2="2", isFriend=True),
		Friend(user1="4", user2="1", isFriend=False),
		Friend(user1="3", user2="2", isFriend=False),	
    ]

    db.session.add_all(users)

    db.session.commit()