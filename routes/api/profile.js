const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('config');
const { check, validationResult } = require('express-validator');
var ObjectId = require('mongodb').ObjectID;
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

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
    await Post.deleteMany({ user: req.user.id });

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

//@route      PUT api/profile/education
//@desc       Add profile education
//@access     private
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Fieldofstudy is required').not().isEmpty(),
  check('from', 'From date required').not().isEmpty(),
  check('fieldofstudy', 'Fieldofstudy is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { school, degree, fieldofstudy, from, to, current, description } = req.body;
  const newEducation = { school, degree, fieldofstudy, from, to, current, description };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.education.unshift(newEducation);
    await profile.save();

    res.json(profile);

  } catch (error) {
    console.error(error);
    res.status(500).json('Server Error');
  }
})

//@route      DELETE api/profile/education/:education_id
//@desc       Delete profile education
//@access     private
router.delete('/education/:education_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ 'user': req.user.id });

    // Get remove index
    const removeIndex = profile.education.map(item => item._id).indexOf(req.params.education_id);
    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json('Server Error');
  }
})

//@route      GET api/profile/github/:username
//@desc       Get user repositories from github
//@access     public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      url: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    const response = await axios(options);

    if (response.status !== 200) {
      return res.status(400).json({ msg: 'No Github profile found' });
    }

    res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json('Server Error');
  }
})

TODO: "Add api/profile/experience/:experience_id route to update experience"

module.exports = router;
