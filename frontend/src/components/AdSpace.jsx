import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fetchPublicSettings } from '../api';

const AdSpace = ({ type = 'horizontal', id }) => {
    const [adScript, setAdScript] = useState('');
    const adContainerRef = useRef(null);

    useEffect(() => {
        const getAdSettings = async () => {
            try {
                const { data } = await fetchPublicSettings();
                // data is an object: { "key": "value" }
                if (data && data.google_adsense_script) {
                    setAdScript(data.google_adsense_script);
                }
            } catch (error) {
                console.error("Failed to fetch AdSense setting", error);
            }
        };
        getAdSettings();
    }, []);

    useEffect(() => {
        if (adScript && adContainerRef.current) {
            try {
                // Clear container
                adContainerRef.current.innerHTML = '';
                
                // Create fragment to run scripts
                const fragment = document.createRange().createContextualFragment(adScript);
                adContainerRef.current.appendChild(fragment);
                
                // If the script needs manual push (though usually handled by fragment)
                if (window.adsbygoogle) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (err) {
                console.error("AdSense Injection Error:", err);
            }
        }
    }, [adScript]);

    return (
        <motion.div 
            className={`ad-wrapper ${type}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <div className="ad-box-inner glass-card">
                <div className="ad-content" id={id || `ad-${Math.random().toString(36).substr(2, 9)}`}>
                    {adScript ? (
                        <div ref={adContainerRef} className="injected-ad-container" />
                    ) : (
                        <>
                            <span className="ad-label text-muted" style={{display: 'block', fontSize: '0.7rem', marginBottom: '5px'}}>ADVERTISEMENT SPACE</span>
                            <div className="ad-placeholder-text">Your Ad Here</div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdSpace;
