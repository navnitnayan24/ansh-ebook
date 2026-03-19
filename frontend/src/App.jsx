import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileFooter from './components/MobileFooter';

// Lazy loaded pages for performance (Goal 6)
const Home = lazy(() => import('./pages/Home'));
const Shayari = lazy(() => import('./pages/Shayari'));
const Music = lazy(() => import('./pages/Music'));
const Podcasts = lazy(() => import('./pages/Podcasts'));
const Ebooks = lazy(() => import('./pages/Ebooks'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

import Sidebar from './components/Sidebar';
import BrandHeader from './components/BrandHeader';

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
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/shayari" element={<PageWrapper><Shayari /></PageWrapper>} />
                <Route path="/poetry" element={<Navigate to="/shayari" replace />} />
                <Route path="/music" element={<LoginRequiredRoute><PageWrapper><Music /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/songs" element={<Navigate to="/music" replace />} />
                <Route path="/podcasts" element={<LoginRequiredRoute><PageWrapper><Podcasts /></PageWrapper></LoginRequiredRoute>} />
                <Route path="/ebooks" element={<LoginRequiredRoute><PageWrapper><Ebooks /></PageWrapper></LoginRequiredRoute>} />
                
                {/* Legacy Redirects */}
                <Route path="/anshnote" element={<Navigate to="/shayari" replace />} />
                <Route path="/creative-writing" element={<Navigate to="/shayari" replace />} />
                
                {/* Auth & Admin */}
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
                <Route path="/admin" element={<ProtectedRoute><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
                
                {/* Legal & Static */}
                <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
                <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
                <Route path="/disclaimer" element={<PageWrapper><Disclaimer /></PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
                <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
                <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Layout>
                    <Suspense fallback={
                        <div className="premium-loader-container">
                            <motion.div 
                                className="premium-loader"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                            <p className="loading-text">UNFOLDING CREATIVITY...</p>
                        </div>
                    }>
                        <AnimatedRoutes />
                    </Suspense>
                </Layout>
            </Router>

        </ThemeProvider>
    );
}

export default App;
