const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const loginId = username || email;
        
        const user = await User.findOne({ 
            $or: [{ username: loginId }, { email: loginId }] 
        });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        const secret = process.env.JWT_SECRET || 'the_alfaz_e_diaries_secure_fallback_2026';
        const token = jwt.sign({ id: user._id, role: 'user' }, secret, { expiresIn: '1d' });
        res.json({ 
            token, 
            _id: user._id, 
            username: user.username, 
            email: user.email, 
            role: 'user',
            profile_pic: user.profile_pic,
            createdAt: user.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const loginId = username || email;
        
        const admin = await Admin.findOne({ 
            $or: [{ username: loginId }, { email: loginId }] 
        });
        
        console.log(`🔐 [ADMIN LOGIN DEBUG] Attempt for: ${loginId}. Found in DB: ${admin ? 'YES' : 'NO'}`);
        if (admin) {
            console.log(`🔐 [ADMIN LOGIN DEBUG] DB Username: ${admin.username}. Email: ${admin.email}`);
        }

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            console.warn(`🔐 [ADMIN LOGIN DEBUG] Login failed for ${loginId}. Reason: ${!admin ? 'Record Not Found' : 'Incorrect Password'}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const secret = process.env.JWT_SECRET || 'the_alfaz_e_diaries_secure_fallback_2026';
        const token = jwt.sign({ id: admin._id, role: 'admin' }, secret, { expiresIn: '1d' });
        res.json({ 
            token, 
            _id: admin._id, 
            username: admin.username, 
            profile_name: admin.profile_name, 
            profile_pic: admin.profile_pic,
            role: 'admin',
            createdAt: admin.createdAt
        });
    } catch (err) {
        console.error('🔐 [ADMIN LOGIN CRITICAL ERROR]:', err);
        res.status(500).json({ error: err.message });
    }
};

// Forgot Password Flow
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Search in both collections
        let account = await Admin.findOne({ email });
        let type = 'admin';
        
        if (!account) {
            account = await User.findOne({ email });
            type = 'user';
        }

        if (!account) {
            return res.status(404).json({ error: 'User not found with this email' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(20).toString('hex');
        account.resetPasswordToken = resetToken;
        account.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await account.save();

        // LOG TOKEN (Since no SMTP)
        console.log(`🔑 PASSWORD RESET TOKEN for ${email} (${type}): ${resetToken}`);
        
        res.json({ 
            message: 'Check server console for reset token (SMTP not configured)', 
            debugToken: resetToken // Returning it for the user to copy easily during tech session
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reset Password Flow
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        let account = await Admin.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!account) {
            account = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
        }

        if (!account) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
        }

        account.password = await bcrypt.hash(password, 10);
        account.resetPasswordToken = undefined;
        account.resetPasswordExpires = undefined;
        await account.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Change Password (ID strictly from Auth Middleware)
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const AccountModel = req.user.role === 'admin' ? Admin : User;
        
        const account = await AccountModel.findById(req.user.id);
        if (!account || !(await bcrypt.compare(oldPassword, account.password))) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        account.password = await bcrypt.hash(newPassword, 10);
        await account.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Profile Picture
exports.updateProfile = async (req, res) => {
    try {
        const { remove, avatarUrl } = req.body;
        const AccountModel = req.user.role === 'admin' ? Admin : User;
        const account = await AccountModel.findById(req.user.id);
        
        if (!account) return res.status(404).json({ error: 'User not found' });

        if (remove === 'true' || remove === true) {
            account.profile_pic = null;
        } else if (avatarUrl) {
            account.profile_pic = avatarUrl;
        } else if (req.file) {
            // Cloudinary path or local upload path
            account.profile_pic = req.file.path || `/uploads/${req.file.filename}`;
        }
        
        await account.save();
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: account._id,
                username: account.username,
                email: account.email,
                role: req.user.role,
                profile_pic: account.profile_pic,
                profile_name: account.profile_name,
                createdAt: account.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
