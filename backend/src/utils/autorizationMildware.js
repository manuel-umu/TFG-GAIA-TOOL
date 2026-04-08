const jwt = require('jsonwebtoken');
const Users = require('../models/user.model.js');

function checkUserRole(requiredRole) {
    return async (req, res, next) => {

        const token = req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {

            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            try {
                const user = await Users.findByPk(decoded.id);

                if (!user) {
                    return res.status(406).json({ error: 'User not found' });
                }

                if (user.role !== requiredRole && user.role !== 'admin') {
                    return res.status(403).json({ message: 'You do not have the required role' });
                }

                req.user = user;
                next();

            } catch (error) {
                return res.status(500).json({ message: 'Database error', error });
            }
        });
    };
}

function checkUser() {
    return async (req, res, next) => {

        const token = req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {

            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            try {
                const user = await Users.findByPk(decoded.id, {
                    attributes: { exclude: ['password'] }
                });

                if (!user) {
                    return res.status(406).json({ error: 'User not found' });
                }

                req.user = user;
                next();

            } catch (error) {
                return res.status(500).json({ message: 'Database error', error });
            }
        });
    };
}


module.exports = {
    checkUserRole,
    checkUser,
}