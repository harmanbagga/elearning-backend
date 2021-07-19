const jwt = require('jsonwebtoken')
const fs = require('fs')
const config = (fs.readFileSync('config.json')).toString()
function verifyToken(req, res, next) {
    console.log('Entered into verify token', req.url);
    var token = req.headers['x-access-token'];
    if (!token)
      return res.status(403).send({ auth: false, message: 'No token provided.' });
      
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err)
        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        
      // if everything good, save to request for use in other routes
      // req.id = decoded.id;
      // console.log('decoded', decoded)
      next();
    });
}

async function createToken(req, res, next) {
  console.log('Entered into create token', req);
  let token = jwt.sign({id:req}, config.tokenSecretKey, {
      expiresIn: 86400 //expires in 24 hrs [86400 sec]
  })
  console.log('token created successfully', token);
  // res.status(200).send({message: 'User created successfully', auth: true, token: token})
  return {message: 'User created successfully', auth: true, token: token}
  // next();
}


module.exports = { verifyToken, createToken };
// export default verifyToken;