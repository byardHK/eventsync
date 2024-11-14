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

class Report(db.model):
    __tablename__ = 'Reports'
    id = db.Column(db.Integer, primary_key=True)
    reportedBy = db.Column(db.Text, nullable=False)
    reportedUser = db.Column(db.Text, nullable=False)
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
    tags = db.relationship('Tags', backref='profile')
    user = db.relationship('User', backref='profile')


class Group(db.Model):
    __tablename__ = 'Group'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode, nullable=False)
    numTimesReported = db.Column(db.Integer, nullable=False)
    chat = db.relationship('Chat', backref='group')
    user = db.relationship('User', backref='group')

class Item(db.Model):
    __tablename__ = 'Item'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.Unicode, nullable=False)
    amountNeeded = db.Column(db.Integer, nullable=False)
    quantityAccountFor = db.Column(db.Integer, nullable=False)
    isFull = db.Column(db.Boolean, nullable=False)
    event = db.Column(db.Integer, db.ForeignKey('Event.id'))

class UserItem(db.Model):
    __tablename__ = 'UserItem'
    item = db.Column(db.Integer, db.ForeignKey(Item.id), primary_key=True)
    user = db.Column(db.Unicode, db.ForeignKey(User.email), primary_key=True)

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