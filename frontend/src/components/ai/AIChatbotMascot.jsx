"use client";

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AIChatMascot({ isStatusTyping, size = 'md', bgClass = 'bg-white', borderClass = 'border-indigo-100' }) {
    const [animationPath, setAnimationPath] = useState('/animations/mascot-idle.json');

    useEffect(() => {
        if (isStatusTyping) {
            setAnimationPath('/animations/mascot-thinking.json');
        } else {
            setAnimationPath('/animations/mascot-idle.json');
        }
    }, [isStatusTyping]);

    // Klasifikasi ukuran tailwind berdasarkan prop 'size'
    const sizeClasses = {
        sm:   "w-8 h-8 p-0.5",
        md:   "w-11 h-11 p-1",
        lg:   "w-16 h-16 p-1.5",
        side: "w-full h-full"   // ukuran dikendalikan sepenuhnya dari container luar
    };

    // DotLottieReact pakai Canvas API — butuh nilai pixel integer eksplisit
    const canvasPx = {
        sm:   28,
        md:   36,
        lg:   52,
        side: 190   // besar, sesuai container 200px
    };

    // Untuk size 'side': styling visual (bg, border, rounded) diurus oleh container luar di AIChatbot.jsx
    // agar kita bisa pakai glassmorphism + overflow-hidden di level yang benar
    if (size === 'side') {
        return (
            <div className="w-full h-full flex items-end justify-center pb-4">
                <DotLottieReact
                    src={animationPath}
                    loop
                    autoplay
                    width={canvasPx.side}
                    height={canvasPx.side}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} ${bgClass} rounded-full border ${borderClass} shadow-sm overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300`}>
            <DotLottieReact
                src={animationPath}
                loop
                autoplay
                width={canvasPx[size]}
                height={canvasPx[size]}
            />
        </div>
    );
}