import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileFooter from './components/MobileFooter';
import { SplashScreen } from '@capacitor/splash-screen';


// Lazy loaded pages for performance (Goal 6)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Shayari = lazy(() => import('./pages/Shayari'));
const Music = lazy(() => import('./pages/Music'));
const Podcasts = lazy(() => import('./pages/Podcasts'));
const Ebooks = lazy(() => import('./pages/Ebooks'));
const ChatPage = lazy(() => import('./realtime-module/pages/ChatPage')); // Realtime Module Hook
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

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

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="app-wrapper">
            <BrandHeader isMobile={isMobile} toggleMenu={toggleMenu} isOpen={isMenuOpen} />
            <div className="layout-body-flex" style={{ marginTop: isMobile ? '80px' : '100px' }}>
                {!isMobile && <Sidebar />}
                <div className={`main-layout ${!isMobile ? 'desktop-with-sidebar' : ''}`}>
                    <main className="content-fluid">{children}</main>
                    <Footer />
                </div>
            </div>
            {isMobile && <MobileFooter />}
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
                                <motion.div 
                                    className="premium-loader"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                />
                                <p className="loading-text">UNFOLDING CREATIVITY... <br/><span style={{fontSize:'10px', opacity:0.6}}>(Service may take a moment to wake up)</span></p>
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
