import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/*
 * AdSpace Component - Renders advertisements inside designated containers
 * 
 * How it works:
 * 1. Google AdSense (loaded globally in index.html) - creates banner ads inside <ins> tags
 * 2. HilltopAds Native Bar - uses container ID, loaded ONCE via a script tag
 * 3. Social Bar (loaded globally in index.html) - floats on its own, not tied to containers
 * 
 * IMPORTANT: On localhost, ads may not render (ad networks require real domains).
 * They will work on production (ansh-ebook.onrender.com).
 */

// Track if the Native Bar script has been injected already
let nativeBarInjected = false;

const AdSpace = ({ type = 'horizontal', id, minimal = false }) => {
    const containerRef = useRef(null);
    const stableId = useRef(id || `ad-${Math.random().toString(36).substring(2, 9)}`);
    const initialized = useRef(false);

    useEffect(() => {
        if (!containerRef.current || initialized.current) return;
        initialized.current = true;

        const el = containerRef.current;

        // === HilltopAds Native Bar ===
        const injectHilltop = () => {
            // Because React SPA navigation doesn't reload the page, 
            // Ad network scripts often fail unless heavily re-evaluated.
            // We append the snippet directly into the specific React container.
            
            const nativeDiv = document.createElement('div');
            // Adding a random suffix so multiple AdSpaces don't create duplicate DOM IDs
            // Note: If the ad strictly requires the exact ID, it might only render the first one.
            nativeDiv.id = 'container-fc31d37af05da68c422a1508c61daeb3'; 
            el.appendChild(nativeDiv);

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = 'https://doubtfulimpatient.com/fc31d37af05da68c422a1508c61daeb3/invoke.js';
            el.appendChild(script);
        };

        // === Google AdSense push ===
        const injectAdSense = () => {
            try {
                const ins = document.createElement('ins');
                ins.className = 'adsbygoogle';
                ins.style.display = 'block';
                ins.style.minHeight = '50px';
                ins.setAttribute('data-ad-client', 'ca-pub-3458226027310065');
                ins.setAttribute('data-ad-format', type === 'square' ? 'rectangle' : 'auto');
                ins.setAttribute('data-full-width-responsive', 'true');
                el.appendChild(ins);

                if (window.adsbygoogle) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (e) {
                console.warn('[AdSpace] AdSense push failed:', e);
            }
        };

        // Initialize based on type/id if needed, or just both for maximum coverage
        injectHilltop();
        const timer = setTimeout(injectAdSense, 1500);

        return () => clearTimeout(timer);
    }, [type]);

    if (minimal) {
        return (
            <div 
                ref={containerRef} 
                className={`ad-minimal-container ${type}`} 
                id={stableId.current}
                style={{ width: '100%', minHeight: '50px', overflow: 'hidden', margin: '5px 0' }}
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
                />
            </div>
        </motion.div>
    );
};

export default AdSpace;
