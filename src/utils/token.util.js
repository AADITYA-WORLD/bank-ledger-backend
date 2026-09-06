const jwt = require('jsonwebtoken');


const generateTokenSetCookie =  (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'strict', // Adjust based on your requirements
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;

}

module.exports = {
  generateTokenSetCookie
};