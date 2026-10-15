import React from 'react';

interface PageBannerProps {
  title: string;
  heading: string;
  subtitle: string;
}

const PageBanner: React.FC<PageBannerProps> = ({ title, heading, subtitle }) => {
  return (
    <>
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-24px) scale(1.03) } }
        @keyframes float2 { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(18px) scale(0.97) } }
        @keyframes float3 { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(12px) } }
        @keyframes spinSlow { to { transform: rotate(360deg) } }
        @keyframes bannerReveal { from { opacity: 0; transform: scale(1.04) } to { opacity: 1; transform: scale(1) } }
        
        .banner-reveal { animation: bannerReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .banner-shape { animation-play-state: running; }
      `}</style>
      <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
          }}
        />
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* floating shapes */}
        <div className="absolute banner-shape" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
          <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>
        <div className="absolute banner-shape" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
          <div className="w-12 h-12 rounded-full border-2 border-white/20" />
        </div>
        <div className="absolute banner-shape" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
          <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
        </div>
        <div className="absolute banner-shape" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
          <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
        </div>
        {/* banner text */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
            {title}
          </p>
          <h2 className="text-4xl font-bold mb-2">{heading}</h2>
          <p className="text-white/70 text-sm max-w-md">
            {subtitle}
          </p>
        </div>
      </div>
    </>
  );
};

export default PageBanner;
