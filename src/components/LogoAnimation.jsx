import React from 'react';
import { Compass } from 'lucide-react';

export function LogoAnimation() {
    return (
        <div className="animate-spin-slow">
            <Compass className="w-8 h-8 text-indigo-600" />
        </div>
    );
} 