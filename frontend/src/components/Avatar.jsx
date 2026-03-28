import React, { useState, useEffect } from 'react';
import { getAvatarUrl } from '../config';

const Avatar = ({ pic, username, className, style }) => {
    const [isError, setIsError] = useState(false);
    
    // Reset error state when pic changes
    useEffect(() => {
        setIsError(false);
    }, [pic]);

    // Instagram-style Silhouette SVG with internal sizing guards
    const Silhouette = () => (
        <div className={`avatar-placeholder-insta ${className}`} style={{ ...style, maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="currentColor"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="currentColor"/>
            </svg>
        </div>
    );

    // If pic is explicitly null or empty, or we already had an error
    if (!pic || pic === 'null' || pic === 'undefined' || isError) {
        return <Silhouette />;
    }

    return (
        <img 
            src={getAvatarUrl(pic, username)} 
            alt="" 
            className={className}
            style={style}
            onError={() => setIsError(true)}
            loading="lazy"
        />
    );
};

export default Avatar;
