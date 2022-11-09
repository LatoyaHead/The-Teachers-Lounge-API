const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const UserModel = require('./models/UserSchema')
const bcrypt = require('bcryptjs')
const session = require('express-session')
const MongoStore = require('connect-mongo')
require('dotenv').config()


const app = express()
app.use(cors()) //allows us to communicate between the 2 apps(client/api)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SECRET,
  store: MongoStore.create({mongoUrl: process.env.MONGO_URI}),
  resave: false,
  saveUninitialized: true
}))

app.get('/', (req, res) => {
  res.json({greet:'Hello'})
})

app.post("/signup", async (req, res) => {
  try {
    // check if user exist
    const userAlreadyExist = await UserModel.find({ email: req.body.email });
    const userNameExist = await UserModel.find({username: req.body.username})

    // if there is a object inside of the array
    if (userAlreadyExist[0]) {
      return res.send("User Already exist!");
    }
    if (userNameExist[0]) {
      return res.send('User already exist!')
    }

    // Create a new user
    const SALT = await bcrypt.genSalt(10) //how secure your hash will be
    //reassign the password to the hashed password
    req.body.password = await bcrypt.hash(req.body.password, SALT)
    const user = await UserModel.create(req.body);
    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.status(403).send("Cannot POST");
  }
});

app.listen(3001,() => {
  console.log("My Server is running 3001");

  // connect to MongoDB
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // confirm that we have a connection to MongoDB
  mongoose.connection.once("open", () => {
    console.log("connected to mongo");
  });
})