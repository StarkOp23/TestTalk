import React from "react";
import { MessageCircle, Send } from "lucide-react";

const TestTalkPreloader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 z-50">
      
      {/* Floating blurred blobs for modern effect */}
      <div className="absolute w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-30 -top-10 -left-10 animate-blob"></div>
      <div className="absolute w-72 h-72 bg-indigo-300 rounded-full blur-3xl opacity-30 -bottom-10 -right-10 animate-blob animation-delay-2000"></div>

      {/* Loader Main */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        
        {/* Orbiting glowing dots */}
        <div className="absolute inset-0 animate-spin-slow">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 120 + 90 * Math.cos(rad);
            const y = 120 + 90 * Math.sin(rad);

            return (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg"
                style={{
                  top: y,
                  left: x,
                  animation: `pulseTiny 2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            );
          })}
        </div>

        {/* Center Glass Orb */}
        <div className="relative w-40 h-40 bg-white/30 backdrop-blur-xl border border-white/40 rounded-full flex items-center justify-center shadow-2xl animate-float-soft">
          
          {/* Inner glowing gradient circle */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 opacity-80 blur-sm animate-pulse-slow"></div>

          {/* Main icon */}
          <Send className="w-10 h-10 text-white relative z-10 animate-wiggle" />
        </div>
      </div>

      {/* Brand Text */}
      <div className="absolute bottom-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
          TestTalk
        </h1>

        <div className="flex justify-center space-x-2 mt-3">
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }

        @keyframes pulseTiny {
          0%,100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        @keyframes float-soft {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-soft {
          animation: float-soft 3.5s ease-in-out infinite;
        }

        @keyframes blob {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.1); }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        @keyframes wiggle {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-wiggle {
          animation: wiggle 2.5s ease-in-out infinite;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

export default TestTalkPreloader;
