import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type, count = 1 }) => {
    const shimmer = {
        initial: { backgroundPosition: '-200% 0' },
        animate: { 
            backgroundPosition: '200% 0',
            transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
        }
    };

    const renderSkeleton = (key) => {
        switch (type) {
            case 'card':
                return (
                    <div key={key} className="skeleton-card glass-card">
                        <motion.div className="skeleton-thumb shimmer" {...shimmer} />
                        <div className="skeleton-info">
                            <motion.div className="skeleton-line shimmer h20 w-80" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h15 w-60" {...shimmer} />
                        </div>
                    </div>
                );
            case 'shayari':
                return (
                    <div key={key} className="skeleton-shayari glass-card">
                        <div className="skeleton-header">
                            <motion.div className="skeleton-circle shimmer" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h15 w-40" {...shimmer} />
                        </div>
                        <div className="skeleton-body">
                            <motion.div className="skeleton-line shimmer h15 w-100" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h15 w-90" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h15 w-70" {...shimmer} />
                        </div>
                        <div className="skeleton-footer">
                            <motion.div className="skeleton-line shimmer h25 w-30" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h25 w-30" {...shimmer} />
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div key={key} className="skeleton-list-item">
                        <motion.div className="skeleton-circle shimmer mr-3" {...shimmer} />
                        <div style={{ flex: 1 }}>
                            <motion.div className="skeleton-line shimmer h15 w-70 mb-2" {...shimmer} />
                            <motion.div className="skeleton-line shimmer h10 w-40" {...shimmer} />
                        </div>
                    </div>
                );
            case 'table-row':
                return (
                    <tr key={key} className="skeleton-table-row">
                        <td><motion.div className="skeleton-line shimmer h20 w-80" {...shimmer} /></td>
                        <td className="hide-mobile"><motion.div className="skeleton-line shimmer h20 w-60" {...shimmer} /></td>
                        <td><motion.div className="skeleton-line shimmer h20 w-40" {...shimmer} /></td>
                    </tr>
                );
            default:
                return (
                    <motion.div 
                        key={key}
                        className="skeleton-line shimmer mb-2" 
                        style={{ height: '20px', width: '100%' }}
                        {...shimmer}
                    />
                );
        }
    };

    return (
        <React.Fragment>
            {[...Array(count)].map((_, i) => renderSkeleton(i))}
        </React.Fragment>
    );
};

export default SkeletonLoader;
