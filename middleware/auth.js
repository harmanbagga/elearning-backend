const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Teacher = require('../models/teacher')
const Student = require('../models/student')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        let user
        if(decoded.role === 'ADMIN'){
            user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
            user.role = 'ADMIN'
        }
        if(decoded.role === 'TEACHER'){
            user = await Teacher.findOne({ _id: decoded._id, 'tokens.token': token })
            user.role = 'TEACHER'
        }
        if(decoded.role === 'STUDENT'){
            user = await Student.findOne({ _id: decoded._id, 'tokens.token': token })
            user.role = 'STUDENT'
        }

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user

        next()
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = auth