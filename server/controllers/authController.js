const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
        const { email, username, password } = req.body;
        const loginId = email || username;
        const secret = process.env.JWT_SECRET || 'ansh_ebook_internal_fallback_secure_2026_@#$';
        
        const user = await User.findOne({ 
            $or: [{ email: loginId }, { username: loginId }] 
        });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user._id, role: 'user' }, secret, { expiresIn: '1d' });
        res.json({ 
            token, 
            _id: user._id, 
            username: user.username, 
            email: user.email, 
            role: 'user',
            profile_pic: user.profile_pic,
            bio: user.bio,
            link: user.link,
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
        const secret = process.env.JWT_SECRET || 'ansh_ebook_internal_fallback_secure_2026_@#$';

        const admin = await Admin.findOne({ 
            $or: [{ username: loginId }, { email: loginId }] 
        });
        
        console.log(`🔐 [ADMIN LOGIN DEBUG] Attempt for: ${loginId}. Found in DB: ${admin ? 'YES' : 'NO'}`);

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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
        let account = await Admin.findOne({ email });
        let type = 'admin';
        
        if (!account) {
            account = await User.findOne({ email });
            type = 'user';
        }

        if (!account) {
            return res.status(404).json({ error: 'User not found with this email' });
        }

        const resetTokenRaw = crypto.randomBytes(20).toString('hex');
        const resetTokenHashed = crypto.createHash('sha256').update(resetTokenRaw).digest('hex');
        
        account.resetPasswordToken = resetTokenHashed;
        account.resetPasswordExpires = Date.now() + 3600000;
        await account.save();

        console.log(`🔑 PASSWORD RESET TOKEN for ${email} (${type}): ${resetTokenRaw}`);
        
        // ✉️ Send Email using Nodemailer
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Determine frontend URL (fallback to production URL)
            const frontendUrl = (process.env.FRONTEND_URL || 'https://ansh-ebook.onrender.com').replace(/\/$/, "");
            const resetURL = `${frontendUrl}/reset-password/${resetTokenRaw}`;

            const mailOptions = {
                from: `"Ansh Ebook Team" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a24; padding: 20px; border-radius: 10px; color: #fff;">
                        <h2 style="color: #e91e63; text-align: center;">ANSH EBOOK</h2>
                        <h3 style="color: #fff;">Password Reset Request</h3>
                        <p>Hi ${account.username || 'User'},</p>
                        <p>We received a request to reset your password. Please click the button below to choose a new password. This link will expire in 1 hour.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetURL}" style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #aaa; font-size: 12px;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
                        <p style="color: #aaa; font-size: 12px;">Link: <a href="${resetURL}" style="color: #00bcd4;">${resetURL}</a></p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.json({ message: 'A password reset link has been sent to your email.' });
        } else {
            // Fallback if environment variables are missing (for local testing/debugging without email setup)
            console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set. Email not sent.");
            res.json({ 
                message: 'Internal System Alert: Email credentials not configured. Please contact the administrator. (The reset token was generated in server logs)'
            });
        }
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: 'There was an error sending the email. Please try again later.' });
    }
};

// Reset Password Flow
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetTokenHashed = crypto.createHash('sha256').update(token).digest('hex');

        let account = await Admin.findOne({
            resetPasswordToken: resetTokenHashed,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!account) {
            account = await User.findOne({
                resetPasswordToken: resetTokenHashed,
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

// Change Password
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
        const { remove, avatarUrl, bio, username, link } = req.body;
        const AccountModel = req.user.role === 'admin' ? Admin : User;
        const account = await AccountModel.findById(req.user.id);
        
        if (!account) return res.status(404).json({ error: 'User not found' });

        if (username) account.username = username;
        if (bio) account.bio = bio;
        if (link !== undefined) account.link = link;

        if (remove === 'true' || remove === true) {
            account.profile_pic = null;
        } else if (avatarUrl) {
            account.profile_pic = avatarUrl;
        } else if (req.file) {
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
                bio: account.bio,
                link: account.link,
                profile_name: account.profile_name,
                createdAt: account.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.followUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) return res.status(400).json({ error: "You cannot follow yourself" });

        const userToFollow = await User.findById(id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) return res.status(404).json({ error: "User not found" });

        if (currentUser.following.includes(id)) {
            return res.status(400).json({ error: "Already following this user" });
        }

        await User.findByIdAndUpdate(req.user.id, { $push: { following: id } });
        await User.findByIdAndUpdate(id, { $push: { followers: req.user.id } });

        res.json({ message: "Successfully followed user" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(req.user.id, { $pull: { following: id } });
        await User.findByIdAndUpdate(id, { $pull: { followers: req.user.id } });
        res.json({ message: "Successfully unfollowed user" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('following', 'username profile_pic bio');
        res.json(user.following);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
