import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, url, image, keywords }) => {
    const siteTitle = "ANSH-EBOOK | THE ALFAZ-E-DIARIES | Premium Art";
    const defaultDesc = "A digital sanctuary by Ansh Sharma (Ansh-Ebook) where words find meaning, melodies touch the soul, and stories inspire greatness.";
    const defaultUrl = "https://anshebook.netlify.app";
    const defaultImage = "/favicon.svg";
    const defaultKeywords = "Ansh-Ebook, Ansh-Ebook, Hindi Shayari, Original Music, News Gazette, Premium Ebooks, Kalam Se Dil Tak";

    return (
        <Helmet>
            {/* Standard HTML Tags */}
            <title>{title ? `${title} | ANSH-EBOOK` : siteTitle}</title>
            <meta name="description" content={description || defaultDesc} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={url || defaultUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url || defaultUrl} />
            <meta property="og:title" content={title ? `${title} | ANSH-EBOOK` : siteTitle} />
            <meta property="og:description" content={description || defaultDesc} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url || defaultUrl} />
            <meta property="twitter:title" content={title ? `${title} | ANSH-EBOOK` : siteTitle} />
            <meta property="twitter:description" content={description || defaultDesc} />
            <meta property="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

export default SEO;
