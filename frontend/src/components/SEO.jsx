import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, url, image }) => {
    const siteTitle = "THE ALFAZ-E-DIARIES | Premium Art";
    const defaultDesc = "A digital sanctuary where words find meaning, melodies touch the soul, and stories inspire greatness.";
    const defaultUrl = "https://anshebook.netlify.app";
    const defaultImage = "/favicon.svg";

    return (
        <Helmet>
            {/* Standard HTML Tags */}
            <title>{title ? `${title} | THE ALFAZ-E-DIARIES` : siteTitle}</title>
            <meta name="description" content={description || defaultDesc} />
            <link rel="canonical" href={url || defaultUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url || defaultUrl} />
            <meta property="og:title" content={title ? `${title} | THE ALFAZ-E-DIARIES` : siteTitle} />
            <meta property="og:description" content={description || defaultDesc} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url || defaultUrl} />
            <meta property="twitter:title" content={title ? `${title} | THE ALFAZ-E-DIARIES` : siteTitle} />
            <meta property="twitter:description" content={description || defaultDesc} />
            <meta property="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

export default SEO;
