const express = require('express')
const LoungeModel = require('../models/LoungeSchema')

const router = express.Router()

//Add privacy to this router
//middleware function
router.use((req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/user/signin')
  }
})
//GET ALL posts
router.get('/', async (req, res) => {
  try {
    const lounges = await LoungeModel.find({})
    res.render('/lounge', {lounges: lounges, loggedInUser: req.session.username})
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot get')
  }
})

router.get('/new', (req, res) => {
  res.render('/New');
});

router.get('/edit/:id', async (req, res) => {
  const lounge = await LoungeModel.findById(req.params.id)
  res.render('/Edit', {LoungeModel: lounge});
});

//GET POST BY ID
router.get('/:id', async (req, res) => {
  try {
    const lounge = await LoungeModel.findById(req.params.id)
    res.render('/Show', {lounge: lounge})
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot get')
  }
})



//POST: CREATE A NEW Post
router.post('/topic', async (req, res) => {
  console.log(req.body);
  try{
    const newLounge = await LoungeModel.create(req.body)
    res.json({topic:newLounge});
  } catch (error) {
      console.log(error);
      res.status(403).send('Cannot create')
  }
})

//PUT: UPDATE BY ID
router.put('/:id', async (req, res) => {
  try {
    const updatedLounge = await LoungeModel.findByIdAndUpdate(req.params.id, req.body, {'returnDocument' : "after"})
    res.redirect('/lounge')
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot put')
  }
  
})

//DELETE: Remove by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedLounge = await LoungeModel.findByIdAndRemove(req.params.id)
    console.log(deletedLounge);
    res.status(200).send('Topic Deleted')
  } catch (error) {
    console.log(error);
    res.status(403).send('Cannot put')
  }
  
})

    

module.exports = router;