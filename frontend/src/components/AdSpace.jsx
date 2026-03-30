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

const AdSpace = ({ type = 'horizontal', id }) => {
    const containerRef = useRef(null);
    const stableId = useRef(id || `ad-${Math.random().toString(36).substr(2, 9)}`);
    const initialized = useRef(false);

    useEffect(() => {
        if (!containerRef.current || initialized.current) return;
        initialized.current = true;

        const el = containerRef.current;
        const currentContainerId = stableId.current;

        // === HilltopAds Native Bar ===
        // Note: Global scripts like HilltopAds often look for a specific ID.
        // We try to inject it provided it's the first one or if we're in a clear state.
        if (!nativeBarInjected) {
            nativeBarInjected = true;
            const nativeDiv = document.createElement('div');
            // Hardcoded ID required by the script
            nativeDiv.id = 'container-fc31d37af05da68c422a1508c61daeb3';
            el.appendChild(nativeDiv);

            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = 'https://doubtfulimpatient.com/fc31d37af05da68c422a1508c61daeb3/invoke.js';
            el.appendChild(script);
        }

        // === Google AdSense auto ad ===
        const tryAdSense = () => {
            if (!el) return;
            try {
                const ins = document.createElement('ins');
                ins.className = 'adsbygoogle';
                ins.style.display = 'block';
                ins.style.minHeight = '90px';
                ins.setAttribute('data-ad-client', 'ca-pub-3458226027310065');
                ins.setAttribute('data-ad-format', type === 'square' ? 'rectangle' : 'auto');
                ins.setAttribute('data-full-width-responsive', 'true');
                el.appendChild(ins);

                // Push only if adsbygoogle is available
                if (window.adsbygoogle) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (e) {
                console.warn('[AdSpace] AdSense push failed:', e);
            }
        };

        // Wait for DOM to be stable
        const timer = setTimeout(tryAdSense, 1000);

        return () => {
            clearTimeout(timer);
            // Optional: reset nativeBarInjected if we want it to reload on other pages
            // nativeBarInjected = false; 
        };

    }, [type]);

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
