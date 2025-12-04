import React, { useEffect, useState } from 'react';
import './GMComLoading.css';

type GMComLoadingProps = {
    variant?: 'full' | 'compact';
    message?: string;
};

const GMComLoading: React.FC<GMComLoadingProps> = ({
    variant = 'full',
    message = 'Now Loading 불법 복사본'
}) => {
    const [showLogo, setShowLogo] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowLogo(prev => !prev);
        }, Math.random() * 3000 + 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`gmcom-container${variant === 'compact' ? ' compact' : ''}`}>
            <div className="noise"></div>
            <div className="scanlines"></div>
            <div className="flicker"></div>

            <div className={`gmcom-logo${showLogo ? ' visible' : ''}`}>
                <span className="gmcom-text">GMCOM</span>
            </div>

            <div className="loading-text">
                {message} <span className="dot1">.</span><span className="dot2">.</span><span className="dot3">.</span>
            </div>
        </div>
    );
};

export default GMComLoading;
