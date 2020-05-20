const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied!' })
  }

  // Verify token
  try { 
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  }
  catch (err) {
    console.error(`auth.js middleware error: ${err}`);
    res.status(401).json({ mag: 'Token is not valid!' })
  }
}