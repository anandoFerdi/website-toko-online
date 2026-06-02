"use client";

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AIChatMascot({ isStatusTyping, size = 'md', bgClass = 'bg-white', borderClass = 'border-indigo-100' }) {
    // Menentukan file mana yang aktif berdasarkan status loading/typing dari chat
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
        sm: "w-8 h-8 p-0.5",     // Untuk avatar di samping chat bubble
        md: "w-11 h-11 p-1",     // Untuk ditaruh di Header
        lg: "w-16 h-16 p-1",   // Untuk tombol floating bawah
        side: "w-full h-full p-2"  // Untuk maskot samping kiri popup (ukuran dari container luar)
    };

    // DotLottieReact menggunakan Canvas API — harus pakai nilai pixel eksplisit,
    // bukan "100%" agar canvas tidak mendapat width=0 saat pertama mount (IndexSizeError)
    const canvasPx = {
        sm: 28,   // w-8(32) - 2*p-0.5(2) = 28
        md: 36,   // w-11(44) - 2*p-1(4)  = 36
        lg: 52,   // w-16(64) - 2*p-1.5(6)= 52
        side: 100   // ukuran wajar dalam container 110px
    };

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