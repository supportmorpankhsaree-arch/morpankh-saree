"use client";

import PublicLayout from '@/components/PublicLayout';
import Image from 'next/image';

export default function Page() {

  return (
    <PublicLayout>
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}
        .stat-card:hover{transform:translateY(-6px) scale(1.03);box-shadow:0 20px 48px hsl(var(--primary)/0.18)}
        .stat-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
        .why-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.14)}
        .why-card{transition:transform 0.25s ease,box-shadow 0.25s ease}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
          }}
        />

        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380,
            height: 380,
            top: -80,
            right: -100,
            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 260,
            height: 260,
            bottom: 60,
            left: -80,
            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: '40%',
            left: '5%',
            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />


        <div className="relative w-full banner-reveal" style={{ overflow: 'hidden' }}>
          <img
            src="/Banner_img.png"
            alt="About Morpankh Saree"
            className="w-full h-auto block"
            style={{ display: 'block' }}
          />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Morpankh Saree
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }} />
          </div>



          <div className="max-w-3xl mx-auto mb-10 fade-up-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { value: '50K+', label: 'Happy Customers', icon: '😊' },
                { value: '200K+', label: 'Sarees Sold', icon: '🧣' },
                { value: '500+', label: 'Weaver Partners', icon: '🧵' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="stat-card rounded-xl p-6 text-center border border-border/60"
                  style={{
                    background: 'hsl(var(--primary)/0.06)',
                    borderLeft: '3px solid hsl(var(--primary)/0.5)',
                    boxShadow: '0 4px 20px hsl(var(--primary)/0.08)',
                  }}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-dark-grey">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 fade-up-4">
            {[
              {
                title: 'Authentic Handcrafted',
                desc: 'Every saree is made by skilled artisans using traditional techniques passed down through generations.',
                icon: '🧵',
                accent: 'primary' as const,
              },
              {
                title: 'Premium Quality',
                desc: 'We ensure top-quality fabrics and craftsmanship in every product, from weave to finish.',
                icon: '✨',
                accent: 'secondary' as const,
              },
              {
                title: 'Trusted by Thousands',
                desc: 'Loved by customers across India with a 4.9★ satisfaction rating based on 200+ reviews.',
                icon: '⭐',
                accent: 'primary' as const,
              },
              {
                title: 'Weaver Partnerships',
                desc: 'We collaborate with 500+ artisan families, ensuring fair wages and sustainable craft preservation.',
                icon: '🤝',
                accent: 'secondary' as const,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="why-card rounded-xl p-6 border border-border/60"
                style={{
                  background:
                    item.accent === 'primary'
                      ? 'hsl(var(--primary)/0.06)'
                      : 'hsl(var(--secondary)/0.08)',
                  borderLeft: '3px solid hsl(var(--primary)/0.5)',
                }}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'hsl(var(--primary))' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>




          {/* Founder Story Section */}
          <div className="max-w-4xl mx-auto mt-16 mb-12">
            <div
              className="rounded-2xl p-8 md:p-12 border border-border/60 shadow-xl"
              style={{ background: 'hsl(var(--primary)/0.04)' }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ color: 'hsl(var(--primary))' }}>
                आमची संस्थापक (Founder) कथा
              </h2>
              <div className="space-y-6 text-base leading-relaxed text-foreground">
                <p>
                  चार वर्षांपूर्वी आम्ही एका छोट्याशा दुकानातून आमच्या प्रवासाची सुरुवात केली. सुरुवातीचे सहा महिने अत्यंत आव्हानात्मक होते. ग्राहक कमी होते, अनेक अडचणी येत होत्या आणि प्रत्येक दिवस हा नव्याने स्वतःला सिद्ध करण्याचा होता. पण आम्ही हार मानली नाही.
                </p>
                <p>
                  हळूहळू ग्राहकांचा विश्वास मिळू लागला आणि आमच्या कष्टांचे फळ दिसू लागले. पूर्ण एक वर्ष झाल्यानंतर आम्ही लाईव्ह सेलिंगची सुरुवात केली. सुरुवातीला लाईव्हवर खूप कमी प्रेक्षक असायचे, पण आमचा विश्वास आणि सातत्य कायम राहिले.
                </p>
                <p>
                  आज आम्हाला अभिमानाने सांगता येते की, एका छोट्या दुकानातून सुरू झालेला हा प्रवास आता एका भव्य साडी शोरूमपर्यंत पोहोचला आहे. इतकेच नाही तर आमची दुसरी शाखाही (Second Branch) यशस्वीरित्या सुरू झाली आहे.
                </p>
                <p>
                  हा प्रत्येक टप्पा आमच्या ग्राहकांच्या विश्वासामुळे, प्रेमामुळे आणि पाठिंब्यामुळे शक्य झाला. आमच्या या यशामागे तुमचा मोठा वाटा आहे.
                </p>
                <p className="font-semibold">मनःपूर्वक धन्यवाद!</p>
                <p>
                  तुमच्या विश्वासाने आणि प्रेमानेच मोरपंख साडी आज या उंचीपर्यंत पोहोचली आहे. पुढेही आम्ही तुम्हाला सर्वोत्तम सेवा आणि उत्कृष्ट साड्यांचा अनुभव देत राहू.
                </p>
                <p className="font-semibold text-lg" style={{ color: 'hsl(var(--primary))' }}>
                  – मोरपंख साडी परिवार ❤️🙏
                </p>
              </div>
            </div>
          </div>

          {/* Vision Section */}
          <div className="max-w-4xl mx-auto mt-16 mb-12">
            <div
              className="rounded-2xl p-8 md:p-12 border border-border/60 shadow-xl"
              style={{ background: 'hsl(var(--secondary)/0.04)' }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ color: 'hsl(var(--primary))' }}>
                मोरपंख साडीचे Vision
              </h2>
              <div className="space-y-6 text-base leading-relaxed text-foreground">
                <p>
                  आमचे स्वप्न केवळ साड्या विकण्याचे नाही, तर प्रत्येक महिलेच्या आयुष्यात आनंद, आत्मविश्वास आणि आपल्या संस्कृतीबद्दलचा अभिमान निर्माण करण्याचे आहे.
                </p>
                <p>
                  आमचे Vision आहे की महाराष्ट्रातील प्रत्येक घराघरात "मोरपंख" हे नाव फक्त एक ब्रँड म्हणून नाही, तर एक भावना (Emotion) म्हणून ओळखले जावे. जेव्हा साडीचा विचार येईल, तेव्हा ग्राहकांच्या मनात सर्वप्रथम मोरपंख साडीचे नाव यावे.
                </p>
                <p>
                  आज आमचा प्रवास पुण्यापासून सुरू झाला असला, तरी भविष्यात महाराष्ट्राच्या कानाकोपऱ्यात मोरपंखच्या शाखा उभ्या राहाव्यात आणि प्रत्येक महिलेला उत्कृष्ट गुणवत्ता, विश्वास आणि सर्वोत्तम सेवा मिळावी, हे आमचे ध्येय आहे.
                </p>
                <p>
                  आमचा ठाम विश्वास आहे की साडी ही केवळ एक वस्त्र नाही, तर ती आपल्या संस्कृतीची, परंपरेची आणि ओळखीची शान आहे. बदलत्या काळातही आपल्या संस्कृतीचे जतन करणे आणि पुढील पिढीपर्यंत ती अभिमानाने पोहोचवणे ही आपली जबाबदारी आहे.
                </p>
                <p>
                  मोरपंख साडीच्या माध्यमातून आम्ही महाराष्ट्राच्या समृद्ध परंपरेला आधुनिकतेची जोड देत प्रत्येक महिलेला तिच्या खास क्षणांसाठी सर्वोत्तम साडी उपलब्ध करून देण्याचा प्रयत्न करत राहू.
                </p>
                <div className="p-4 rounded-xl border border-primary/20" style={{ background: 'hsl(var(--primary)/0.06)' }}>
                  <p className="font-semibold text-center text-lg italic" style={{ color: 'hsl(var(--primary))' }}>
                    "प्रत्येक महिलेच्या चेहऱ्यावर हसू आणि प्रत्येक घरात आपल्या संस्कृतीचा अभिमान जपणे, हेच मोरपंख साडीचे खरे Vision आहे."
                  </p>
                </div>
                <p className="font-semibold">धन्यवाद!</p>
                <p className="font-semibold text-lg" style={{ color: 'hsl(var(--primary))' }}>
                  मोरपंख साडी परिवार ❤️🦚🙏
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
