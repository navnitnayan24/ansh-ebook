import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/*
 * AdSpace Component - Renders Native Bar ads INSIDE designated containers
 * 
 * How it works:
 * 1. Creates the required container div with the exact ID the ad network expects
 * 2. Appends the invoke.js script right after it so it discovers the container
 * 3. Everything renders INSIDE this React component — no floating overlays
 * 
 * IMPORTANT: On localhost, ads may not render (ad networks require real domains).
 * They will work on production (ansh-ebook.onrender.com).
 */

const AdSpace = ({ type = 'horizontal', id, minimal = false }) => {
    const containerRef = useRef(null);
    const stableId = useRef(id || `ad-${Math.random().toString(36).substring(2, 9)}`);
    const initialized = useRef(false);

    useEffect(() => {
        if (!containerRef.current || initialized.current) return;
        initialized.current = true;

        const el = containerRef.current;

        // === Native Bar Ad (Renders INSIDE this container) ===
        const injectNativeBar = () => {
            // Create the ad container div with the exact ID the network expects
            const nativeDiv = document.createElement('div');
            nativeDiv.id = 'container-fc31d37af05da68c422a1508c61daeb3';
            nativeDiv.style.cssText = 'width:100%; display:flex; justify-content:center; align-items:center;';
            el.appendChild(nativeDiv);

            // Append the invoke script right next to the container
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = 'https://pl29012496.profitablecpmratenetwork.com/fc31d37af05da68c422a1508c61daeb3/invoke.js';
            el.appendChild(script);
        };

        // Small delay to ensure DOM is painted before injecting
        const timer = setTimeout(injectNativeBar, 300);

        return () => clearTimeout(timer);
    }, []);

    if (minimal) {
        return (
            <div 
                ref={containerRef} 
                className={`ad-minimal-container ${type}`} 
                id={stableId.current}
                style={{ 
                    width: '100%', 
                    minHeight: '50px', 
                    overflow: 'hidden', 
                    margin: '5px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            />
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
                <span className="ad-label-tag">AD</span>
                <div 
                    ref={containerRef} 
                    className="injected-ad-container" 
                    id={stableId.current}
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}
                />
            </div>
        </motion.div>
    );
};

export default AdSpace;
