const Users = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handleValidation = require('../validators/handleValidations.js');
const EmailService = require('../services/mailer');

async function user_logged(req, res) {
    
    const token = req.cookies?.jwt;

    if (!token) {
        return res.status(401).json({ message: 'No authorization' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ id: payload.id, name: payload.name });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

async function register(req, res) {

    if (handleValidation(req, res)) return;

    const { username, password, name, first_second_name, email } = req.body;

    try {
        let existingUser = await Users.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({errors: { username: 'Username already exists.' }});
        }

        existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({errors: { email: 'This email is already being used.' }});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await Users.create({
            username,
            password: hashedPassword,
            name,
            first_second_name,
            email,
            role: 'evaluator_auditor'
        });

        const userData = {
            id: newUser.id,
            name: newUser.name
        }
        
        const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '1h' });
        const isDev = process.env.NODE_ENV !== 'production';
        const cookiesOptions = {
            expires: new Date(Date.now() + 60 * 60 * 1000),
            httpOnly: true,
            secure: !isDev,
            sameSite: isDev ? 'Lax' : 'None',
            path: '/',
        };

        res.cookie('jwt', token, cookiesOptions);

        res.status(201).json({
            message: 'User registered successfully.',
            id: newUser.id,
            name: newUser.name,
            role: newUser.role
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function login(req, res) {

    const { username, email, password } = req.body;

    try {
        let user = null;
        if (username) {
            user = await Users.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid username.' });
            }
        } else if (email) {
            user = await Users.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid email.' });
            }
        } else {
            return res.status(400).json({ error: 'Username or email is required.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        const userData = {
            id: user.id,
            name: user.name
        }

        const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '1h' });

        const isDev = process.env.NODE_ENV !== 'production';
        const cookiesOptions = {
            expires: new Date(Date.now() + 60 * 60 * 1000),
            httpOnly: true,
            secure: !isDev,
            sameSite: isDev ? 'Lax' : 'None',
            path: '/',
        };

        res.cookie('jwt', token, cookiesOptions);

        res.status(200).json({
            message: 'User logged in successfully',
            id: user.id,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function logout(req, res) {
    try {
        const isDev = process.env.NODE_ENV !== 'production';
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: !isDev,
            sameSite: isDev ? 'Lax' : 'None',
            path: '/',
        });
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_users(req, res) {
    try {
        const users = await Users.findAll({
            attributes: { exclude: ['password'] }
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_user(req, res) {
    const { id } = req.params;
    try {
        const user = await Users.findOne({
            where: { id },
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function change_role_user(req, res) {

    const { id } = req.params;
    const { role } = req.body;

    // Igual que login, no tiene validación de cuerpo, se comprueba que se haya enviado role
    if (!role) {
        return res.status(400).json({ error: "Role is required" });
    }

    try {
        const user = await Users.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Users.update(
            { role },
            { where: { id } }
        );
        res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function change_password_user(req, res) {
    const { id } = req.params;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        return res.status(400).json({ error: "Old password and new password are required" });
    }

    try {
        const user = await Users.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(old_password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid old password' });
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await Users.update(
            { password: hashedPassword },
            { where: { id } }
        );
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function update_user(req, res) {

    const { id } = req.params;
    const { username, name, first_second_name, email } = req.body;

    if (!username || !name || !email ) {
        return res.status(400).json({ error: "Username, name and email are required" });
    }

    try {
        const user = await Users.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Users.update(
            { username, name, first_second_name, email },
            { where: { id } }
        );
        res.status(200).json({ message: 'User updated successfully' });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_user(req, res) {
    const { id } = req.params;
    try {
        const user = await Users.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await Users.destroy({ where: { id } });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function recover_password(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const user = await Users.findOne({ where: { email } });
    if (!user) {
         return res.status(404).json({ error: "Email not valid" });
    }

    const code = generateRecoveryCode();
    const expiry = new Date(Date.now() + 10*60*1000); // 10 minutes validity

    // Save code and expiry in the database
    await user.update({ recovery_code: code, code_expiry: expiry });

    // Send email
    const success = await EmailService.sendRecoveryCode(email, code);

    if (success) {
        res.json({ message: "Recovery code sent to your email" });
    } else {
        res.status(500).json({ error: "Failed to send recovery email" });
    }
}

async function check_recover_password(req, res) {

    const {  email, code, password } = req.body;
    if (!code || !email) {
        return res.status(400).json({ error: "Email, code and password are required" });
    }

    const user = await Users.findOne({ where: { email } });
    if (!user) {
        res.status(404).json({ error: "User not found" });
    } 

    const datetime = new Date();
    if (user.code_expiry < datetime) {
        return res.status(400).json({ error: "Recovery code has expired" });
    }
    
    if (user.recovery_code !== code) {
        return res.status(400).json({ error: "Invalid recovery code" });
    }

    if (!password || password.length < 5 || password.length > 200 || !/\d/.test(password)) {
        return res.status(400).json({ error: "Password must be at least 5 characters and contain at least one digit" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Users.update(
        { password: hashedPassword, recovery_code: null, code_expiry: null },
        { where: { id: user.id } }
    );
    res.json({ message: "Recovery code is valid" });

}

function generateRecoveryCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    register,
    login,
    logout,
    get_users,
    get_user,
    update_user,
    change_role_user,
    change_password_user,
    delete_user,
    recover_password,
    check_recover_password,
    user_logged,
};