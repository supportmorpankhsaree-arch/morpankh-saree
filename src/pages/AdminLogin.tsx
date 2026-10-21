import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import logo from '@/assets/logo.png';
import Image from 'next/image';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtp('');
        setStep('otp');
        toast({ title: 'OTP sent', description: `Check your email ${data.email}.` });
      } else {
        toast({ title: data.error || 'Invalid admin credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Login failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token, true);
        toast({ title: 'Welcome, Admin!' });
        router.push('/admin');
      } else {
        toast({ title: data.error || 'OTP verification failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'OTP verification failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: data.error || 'Could not resend OTP', variant: 'destructive' });
        return;
      }
      setOtp('');
      toast({ title: 'OTP resent', description: `Check your email ${data.email}.` });
    } catch {
      toast({ title: 'Could not resend OTP. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInR { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .panel-left{opacity:0;animation:slideIn 0.8s ease forwards}
        .panel-right{opacity:0;animation:slideInR 0.8s ease forwards}
        .s1{animation:fadeUp 0.6s ease 0.1s both}
        .s2{animation:fadeUp 0.6s ease 0.2s both}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 10px 25px hsl(var(--primary)/0.4)}
      `}</style>

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 relative panel-left"
        style={{ background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(220 60% 18%))' }}
      >
        {/* floating shapes */}
        <div className="absolute top-20 left-16" style={{ animation: 'float1 8s ease-in-out infinite' }}>
          <div className="w-20 h-20 border border-white/20 rounded-2xl rotate-12" />
        </div>

        <div className="absolute bottom-20 right-20" style={{ animation: 'float2 7s ease-in-out infinite' }}>
          <div className="w-14 h-14 border border-white/20 rounded-full" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Portal
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Direct & Secure <br />
            <span className="text-white/70">Dashboard Access</span>
          </h2>

          <p className="text-white/70 text-sm max-w-sm">
            Sign in to manage your products, orders, categories, and store settings from the Morpankh admin control center.
          </p>

          {/* small stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { num: '100%', label: 'Encrypted' },
              { num: '24/7', label: 'Availability' },
              { num: 'Direct', label: 'Access' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="font-bold">{item.num}</p>
                <p className="text-xs text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 panel-right">
        <div className="w-full max-w-sm">
          {/* HEADER */}
          <div className="text-center mb-8 s1">
            <Image src={logo} alt="logo" height={200} width={200} className="mx-auto" priority />
            <h1 className="text-2xl font-bold mt-2">Admin Login</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to Morpankh dashboard
            </p>
          </div>

          {step === 'credentials' ? (
          <form onSubmit={handleSubmit} className="space-y-4 s2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  required
                  autoComplete="username"
                  className="w-full border rounded-xl pl-10 pr-4 py-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  className="w-full border rounded-xl pl-10 pr-4 py-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-main w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 s2">
              <div className="text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter the six-digit code sent to {email}.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Verification code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    className="w-full border rounded-xl pl-10 pr-4 py-3 bg-background text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn-main w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : <>Verify OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtp(''); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-primary hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* FOOTER */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Protected by secure encrypted authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
