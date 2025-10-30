// src/contexts/HelpContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HelpContextType {
    helpContent: { pageName: string; content: ReactNode } | null;
    setHelpContent: (content: { pageName: string; content: ReactNode } | null) => void;
    showHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const useHelp = () => {
    const context = useContext(HelpContext);
    if (!context) {
        throw new Error('useHelp must be used within HelpProvider');
    }
    return context;
};

interface HelpProviderProps {
    children: ReactNode;
    onShowHelp: () => void;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children, onShowHelp }) => {
    const [helpContent, setHelpContent] = useState<{ pageName: string; content: ReactNode } | null>(null);

    const showHelp = () => {
        onShowHelp();
    };

    return (
        <HelpContext.Provider value={{ helpContent, setHelpContent, showHelp }}>
            {children}
        </HelpContext.Provider>
    );
};