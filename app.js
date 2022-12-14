const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const UserModel = require('./models/UserSchema')
const LoungeModel = require('./models/LoungeSchema')
const bcrypt = require('bcryptjs')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const JWT = require('jsonwebtoken')
require('dotenv').config()
const Pusher = require('pusher')
const compression = require('compression')

const PORT = process.env.PORT || 3001
const app = express()
const pusher = new Pusher({ 
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});
app.use(cors()) //allows us to communicate between the 2 apps(client/api)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SECRET,
  store: MongoStore.create({mongoUrl: process.env.MONGO_URI}),
  resave: false,
  saveUninitialized: true
}))
app.use(compression())

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
    const token = createJWT(user)
    res.json({token, auth:true, user});//sends token back once signed up
  } catch (error) {
    console.log(error);
    res.status(403).send("Cannot POST");  
  }
});
app.post('/signin', async (req, res) => {
  try {
    //find user by email in db
    const user = await UserModel.findOne({email: req.body.email})
    if (!user) return res.status(400).send('Please check your email!')
    //check if passwords match
    const decodedPassword = await bcrypt.compare(req.body.password, user.password)
    if(!decodedPassword) return res.status(400).send('Please check your password!')
    // Create JWT token
    const token = createJWT(user) //token created
    //set the user session
    //create a new username in the session obj using the user info from db
    req.session.username = user.username
    req.session.loggedIn = true
    res.json({token, auth:true, user});//send info back
  } catch (error) {
    console.log(error);
    res.status(403).send("Cannot POST");
  }
})

//GET UserTopics
app.get('/topics', async (req, res) => { //
  try{
    const topics = await LoungeModel.find({})
    res.json(topics)
  }catch (error) {
    res.status(403).send("No Topics Found");
  }
})


//POST: CREATE A NEW Post
app.post('/topic', async (req, res) => {
  try{
    const newLounge = await LoungeModel.create(req.body)
    res.json({topic:newLounge});
  } catch (error) {
    res.status(403).send('Cannot create')
  }
})

//DELETE: Remove by ID
app.delete('/remove/:id', async (req, res) => {
  console.log(req.params);
  try {
    const deletedTopic = await LoungeModel.findByIdAndRemove(req.params.id)
    console.log(deletedTopic);
    res.json({message:"Topic Deleted"})
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot put')
  }
  
})

//GET POST BY ID
app.get('/:id', async (req, res) => {
  try {
    const topic = await LoungeModel.findById(req.params.id)
    res.json(topic)
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot get')
  }
})

//PUT: UPDATE BY ID
app.put('/:id', async (req, res) => {
  try {
    const updatedTopic = await LoungeModel.findByIdAndUpdate(req.params.id, req.body, {'returnDocument' : "after"})
    res.json(updatedTopic)
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot update')
  }
  
})

//Message: trigger pusher 
 app.post('/message', (req, res) => {
  console.log(req.body);
  pusher.trigger("my-channel", "my-event", {
    message: req.body.message,
    author_id: req.body.author_id,
    username: req.body.author
  });
 })   



/*-- Helper Functions --*/
function createJWT(user){
  return JWT.sign({user}, process.env.SECRET, {expiresIn: '24h'})
}

app.listen(PORT,() => {
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