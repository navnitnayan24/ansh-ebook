import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileFooter from './components/MobileFooter';
// SplashScreen import - safe fallback for non-native environments
let SplashScreen;
try {
    SplashScreen = require('@capacitor/splash-screen').SplashScreen;
} catch (e) {
    SplashScreen = { hide: () => Promise.resolve() };
}


// Lazy Retry Utility: Automatically reloads the page if a chunk fails to load 
// (happens when a new build is pushed and the old version is still in browser cache)
const lazyRetry = (componentImport) => {
    return lazy(async () => {
        const pageKey = 'retry-lazy-' + window.location.pathname;
        const hasRetried = window.sessionStorage.getItem(pageKey);
        try {
            const module = await componentImport();
            // Verify the module has a default export (prevents 'reading default' error)
            if (!module || !module.default) {
                throw new Error('Module loaded but has no default export');
            }
            // Clear retry flag on success
            window.sessionStorage.removeItem(pageKey);
            return module;
        } catch (error) {
            if (!hasRetried) {
                // On ANY chunk loading error, reload once to get fresh assets
                window.sessionStorage.setItem(pageKey, 'true');
                window.location.reload();
                return { default: () => null }; // Fallback while reloading
            }
            // Already retried once — throw to ErrorBoundary
            throw error;
        }
    });
};

const Home = lazyRetry(() => import('./pages/Home'));
const Login = lazyRetry(() => import('./pages/Login'));
const Register = lazyRetry(() => import('./pages/Register'));
const Profile = lazyRetry(() => import('./pages/Profile'));
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'));
const Terms = lazyRetry(() => import('./pages/Terms'));
const Privacy = lazyRetry(() => import('./pages/Privacy'));
const Disclaimer = lazyRetry(() => import('./pages/Disclaimer'));
const ForgotPassword = lazyRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyRetry(() => import('./pages/ResetPassword'));
const Shayari = lazyRetry(() => import('./pages/Shayari'));
const Music = lazyRetry(() => import('./pages/Music'));
const Podcasts = lazyRetry(() => import('./pages/Podcasts'));
const Ebooks = lazyRetry(() => import('./pages/Ebooks'));
const ChatPage = lazyRetry(() => import('./realtime-module/pages/ChatPage'));
const Settings = lazyRetry(() => import('./pages/Settings'));
const NotFound = lazyRetry(() => import('./pages/NotFound'));

import './styles/Stories.css';

import Sidebar from './components/Sidebar';
import BrandHeader from './components/BrandHeader';
import { SocketProvider } from './realtime-module/context/SocketContext'; // Realtime Module Hook

const ProtectedRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Any logged-in user (user OR admin) can access these pages
const LoginRequiredRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const Layout = ({ children }) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    
    // We strictly use CSS fixed positioning to lock the layout, bypassing unreliable vh logic.
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);
    
    const location = useLocation();
    const isChatPage = location.pathname === '/chat';

    return (
        <div 
            className="app-wrapper" 
            style={isChatPage ? { 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column',
                height: '100dvh'
            } : {}}
        >
            <BrandHeader 
                isMobile={isMobile} 
                toggleMenu={toggleMenu} 
                isOpen={isMenuOpen} 
                style={isChatPage ? { position: 'relative' } : {}} 
            />
            <div 
                className="layout-body-flex" 
                style={{ 
                    paddingTop: isChatPage ? '0' : (isMobile ? '80px' : '100px'),
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: isChatPage ? 'row' : 'column',
                    boxSizing: 'border-box'
                }}
            >
                {!isMobile && <Sidebar />}
                <div 
                    className={`main-layout ${!isMobile ? 'desktop-with-sidebar' : ''} ${isChatPage ? 'height-full-flex' : ''}`}
                    style={isChatPage ? { 
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        height: '100%', 
                        overflow: 'hidden',
                        paddingBottom: 0
                    } : {}}
                >
                    <main className={isChatPage ? "height-full-flex" : "content-fluid"} style={isChatPage ? { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' } : {}}>
                        {children}
                    </main>
                    {!isChatPage && <Footer />}
                </div>
            </div>
            {isMobile && !isChatPage && <MobileFooter />}
            {isMobile && <Navbar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} closeMenu={closeMenu} />}
        </div>
    );
};

// Page Transition Wrapper
const PageWrapper = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
        >
            {children}
        </motion.div>
    );
};

// Animated Routes Component
const AnimatedRoutes = () => {
    const location = useLocation();
    
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Main SPA Route */}
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                
                {/* Dedicated Pages */}
                <Route path="/shayari" element={<PageWrapper><Shayari /></PageWrapper>} />
                <Route path="/music" element={<LoginRequiredRoute><PageWrapper><Music /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/podcasts" element={<LoginRequiredRoute><PageWrapper><Podcasts /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/ebooks" element={<LoginRequiredRoute><PageWrapper><Ebooks /></PageWrapper></LoginRequiredRoute>} />
                
                {/* Legacy & SEO Redirects */}
                <Route path="/poetry" element={<Navigate to="/#shayari" replace />} />
                <Route path="/songs" element={<Navigate to="/#premium" replace />} />
                <Route path="/anshnote" element={<Navigate to="/#shayari" replace />} />
                
                {/* Auth & Admin - Keep as separate pages */}
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                <Route path="/profile" element={<LoginRequiredRoute><PageWrapper><Profile /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/chat" element={<LoginRequiredRoute><PageWrapper><ChatPage /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/settings" element={<LoginRequiredRoute><PageWrapper><Settings /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/admin" element={<ProtectedRoute><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
                
                {/* Legal & Static - Keep as separate pages or move to Home? 
                    The user wants About and Connect on Home. 
                    We'll keep these routes but they will redirect or we keep them for SEO.
                */}
                <Route path="/about" element={<Navigate to="/#about" replace />} />
                <Route path="/contact" element={<Navigate to="/#connect" replace />} />
                <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
                <Route path="/disclaimer" element={<PageWrapper><Disclaimer /></PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
                <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
                <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    React.useEffect(() => {
        // Hide Splash Screen as soon as the app mounts
        SplashScreen.hide().catch(err => console.warn('SplashScreen hide failed (Not on native device):', err));
    }, []);

    return (
        <ThemeProvider>
            <SocketProvider>
                <Router>
                    <Layout>
                        <Suspense fallback={
                            <div className="premium-loader-container">
                                <div className="premium-loader"></div>
                                <p className="loading-text">UNFOLDING CREATIVITY... <br/>
                                    <span style={{fontSize:'10px', opacity:0.6}}>(Synchronizing with server...)</span>
                                </p>
                            </div>
                        }>
                            <AnimatedRoutes />
                        </Suspense>
                    </Layout>
                </Router>
            </SocketProvider>
        </ThemeProvider>
    );
}

export default App;
