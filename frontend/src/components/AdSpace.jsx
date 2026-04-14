import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/*
 * AdSpace Component - Renders ads INSIDE designated containers (not floating)
 * 
 * Native Bar: Rendered via JSX container + script injection
 * The container div is rendered directly in JSX so it exists in DOM immediately.
 * The script tag is appended via useEffect after mount.
 */

const AdSpace = ({ type = 'horizontal', id, minimal = false }) => {
    const scriptInjected = useRef(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (scriptInjected.current || !wrapperRef.current) return;
        scriptInjected.current = true;

        // Inject the invoke.js script AFTER the container div already exists in DOM
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://pl29012496.profitablecpmratenetwork.com/fc31d37af05da68c422a1508c61daeb3/invoke.js';
        wrapperRef.current.appendChild(script);
    }, []);

    if (minimal) {
        return (
            <div 
                ref={wrapperRef}
                style={{ 
                    width: '100%', 
                    minHeight: '60px', 
                    overflow: 'hidden', 
                    margin: '8px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                }}
            >
                {/* The container the ad network looks for — rendered directly in JSX */}
                <div id="container-fc31d37af05da68c422a1508c61daeb3"></div>
            </div>
        );
    }

    return (
        <motion.div 
            className={`ad-wrapper ${type}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <div className={`ad-box-inner ad-box-${type}`}>
                <span className="ad-label-tag">SPONSORED</span>
                <div 
                    ref={wrapperRef}
                    className="injected-ad-container" 
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}
                >
                    {/* The container the ad network looks for — rendered directly in JSX */}
                    <div id="container-fc31d37af05da68c422a1508c61daeb3"></div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdSpace;
