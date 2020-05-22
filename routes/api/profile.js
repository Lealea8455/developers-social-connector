const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
var ObjectId = require('mongodb').ObjectID;
const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@route      GET api/profile/me
//@desc       Get current users profile
//@access     Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user.' });
    }

    res.json(profile);
  } catch (err) {
    console.error(`profile.js error: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

//@route      POST api/profile
//@desc       Create or update a user profile
//@access     Private
router.post('/', [auth, [
  check('status', 'Status is requires').not().isEmpty(),
  check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;

  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;

  if (skills) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    profileFields.skills = skillsArray;
  }

  profileFields.social = {}; // Must initialize social object before adding it properties, otherwise will not find X of undefined {profileFields.social.X}  
  if (youtube) profileFields.social.youtube = youtube;
  if (facebook) profileFields.social.facebook = facebook;
  if (twitter) profileFields.social.twitter = twitter;
  if (instagram) profileFields.social.instagram = instagram;
  if (linkedin) profileFields.social.linkedin = linkedin;

  // Add data to database 
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

//@route      GET api/profile
//@desc       Get all profiles
//@access     Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

//@route      GET api/profile/:user_id
//@desc       Get profile by user id
//@access     Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id })
      .populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.send(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'objectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
})

//@route      DELETE api/profile
//@desc       Delete profile, user & posts
//@access     private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove users posts

    // Remove profile
    await Profile.findOneAndDelete({ user: req.user.id });

    // Remove user
    await User.findOneAndDelete({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json('Server Error');
  }
});

//@route      PUT api/profile/experience
//@desc       Add profile experience
//@access     private
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, company, location, from, to, current, description } = req.body;
  const newExperience = { title, company, location, from, to, current, description };

  try {
    const profile = await Profile.findOne({ 'user': req.user.id });

    profile.experience.unshift(newExperience);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

//@route      DELETE api/profile/experience/:experience_id
//@desc       Delete profile experience
//@access     private
router.delete('/experience/:experience_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ 'user': req.user.id });
    // Get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.experience_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

//@route      UPDATE api/profile/experience/:experience_id
//@desc       Update profile experience
//@access     private
router.put('/experience/:experience_id', auth, async (req, res) => {
  const { title, company, location, from, to, current, description } = req.body;

  try {
    const profile = await Profile.findOne({ 'user': req.user.id});
    const profile2 = await Profile.findOne({ 'user': req.user.id, 'experience': {_id: ObjectId(req.params.experience_id)}});

    // const r = await Profile.updateOne({ 'user': req.user.id, 'experience.id': req.params.experience_id },
      // { $set: { 'experience.$.title': 'test2' } });

    const f = await Profile.findOneAndUpdate(
      { 'user': req.user.id, experience: {$elemMatch: {id: req.params.experience_id}} }, { bio: 'test'}, {returnOriginal: false} )

    // console.log(r.n);
    // console.log(r.nModified);

    // await profile.save();

    // res.json(profile);
    res.json(f);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})
module.exports = router;

/*
    const updateIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.experience_id);

    if(title)  profile.experience[updateIndex].title = title;
    if(company)  profile.experience[updateIndex].company = company;
    if(location)  profile.experience[updateIndex].location = location;
    if(from)  profile.experience[updateIndex].from = from;
    if(to)  profile.experience[updateIndex].to = to;
    if(description)  profile.experience[updateIndex].description = description;




    const updated = {};
    if (title) updated[title] = title;
    if (company) updated[company] = company;
    if (location) updated[location] = location;
    if (from) updated[from] = from;
    if (to) updated[to] = to;
    if (description) updated[description] = description;


*/