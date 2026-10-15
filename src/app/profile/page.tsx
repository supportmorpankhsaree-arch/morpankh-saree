"use client";



import { useState, useEffect } from 'react';

import Link from 'next/link';

import { useStore } from '@/store/useStore';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';

import { User, Edit3, Mail, Phone, MapPin, CheckCircle, XCircle, Gift, Copy, Users, Share2, KeyRound } from 'lucide-react';

import { toast } from '@/hooks/use-toast';



import PublicLayout from '@/components/PublicLayout';



interface UserProfile {

  name: string;

  email: string;

  verified: boolean;

  id: string;

  mobile?: string;

  alternateMobile?: string;

  address?: string;

  city?: string;

  pincode?: string;

  referral_code?: string;

  referred_by?: string;

  has_used_referral?: boolean;

  superCoinsBalance?: number;

}

interface ReferralDataResponse {
  success: boolean;
  referralCode: string;
  stats?: {
    totalReferrals: number;
    totalCoinsEarned: number;
  };
}




const ProfilePage = () => {

  const { isLoggedIn, user, token } = useStore((s) => ({ 

    isLoggedIn: s.isLoggedIn, 

    user: s.user, 

    token: s.token 

  }));

  const [isEditing, setIsEditing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [saveMessage, setSaveMessage] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});

  const [referralData, setReferralData] = useState<ReferralDataResponse | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  // Forgot Password state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  

  // Initialize profile data from logged-in user

  const [profileData, setProfileData] = useState<UserProfile>(() => ({

    name: user?.name || '',

    email: user?.email || '',

    verified: user?.verified || false,

    id: user?.id || '',

    mobile: user?.mobile || '',

    alternateMobile: user?.alternateMobile || '',

    address: user?.address || '',

    city: user?.city || '',

    pincode: user?.pincode || ''

  }));



  // Update profile data when user changes

  useEffect(() => {

    if (user) {

      setProfileData({

        name: user.name || '',

        email: user.email || '',

        verified: user.verified || false,

        id: user.id || '',

        mobile: user.mobile || '',

        alternateMobile: user.alternateMobile || '',

        address: user.address || '',

        city: user.city || '',

        pincode: user.pincode || ''

      });

    }

  }, [user]);

  // Fetch referral data
  useEffect(() => {
    if (isLoggedIn && token) {
      setReferralLoading(true);
      fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              console.debug('Referral API endpoint not available');
              return null;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data?.success) {
            setReferralData(data);
          }
        })
        .catch(err => {
          console.error('Error fetching referral data:', err);
        })
        .finally(() => setReferralLoading(false));
    }
  }, [isLoggedIn, token]);

  // Set referral link when referralData is available
  useEffect(() => {
    if (referralData?.referralCode && typeof window !== 'undefined') {
      setReferralLink(`${window.location.origin}/register?ref=${referralData.referralCode}`);
    }
  }, [referralData]);

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
        .then(() => {
          setCopied(true);
          toast({
            title: "Code Copied!",
            description: "Your referral code has been copied to the clipboard.",
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast({
            title: "Failed to Copy",
            description: "Could not copy the code. Please select and copy it manually.",
            variant: "destructive",
          });
        });
    }
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          toast({
            title: "Link Copied!",
            description: "Your referral link has been copied to the clipboard.",
          });
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast({
            title: "Failed to Copy",
            description: "Could not copy link. Please select and copy it manually.",
            variant: "destructive",
          });
        });
    }
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Morpankh Saree',
          text: `Use my referral code "${referralData?.referralCode}" to register on Morpankh Saree and earn rewards!`,
          url: referralLink,
        });
        toast({
          title: "Shared successfully!",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Failed to share",
            description: "Something went wrong while trying to share the link.",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser does not support native sharing. Copy the link instead!",
        variant: "destructive",
      });
    }
  };

  // Forgot Password handlers
  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: profileData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
        setOtp('');
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to your registered email.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: profileData.email,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        toast({
          title: "OTP Verified",
          description: "OTP verified successfully. You can now reset your password.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validatePassword = (password: string, confirm: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    if (password !== confirm) {
      errors.push('Passwords do not match');
    }

    setPasswordError(errors.length > 0 ? errors[0] : '');
  };

  const handleResetPassword = async () => {
    setIsSavingPassword(true);
    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: profileData.email,
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully.",
        });
        setIsForgotPasswordOpen(false);
        // Reset form state
        setOtpSent(false);
        setOtpVerified(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCountdown(0);
        setPasswordError('');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };







  const handleProfileUpdate = async (e: React.FormEvent) => {

    e.preventDefault();

    setIsLoading(true);

    setSaveMessage('');



    const normalizeOptionalString = (value: unknown) => {

      const s = String(value ?? '').trim();

      return s.length > 0 ? s : '';

    };



    const digitsOnly = (value: unknown) => normalizeOptionalString(value).replace(/\D/g, '');



    const validateProfile = () => {

      const errors: Partial<Record<keyof UserProfile, string>> = {};



      const mobileDigits = digitsOnly(profileData.mobile);

      const altDigits = digitsOnly(profileData.alternateMobile);

      const pincodeDigits = digitsOnly(profileData.pincode);

      const address = normalizeOptionalString(profileData.address);

      const city = normalizeOptionalString(profileData.city);



      if (mobileDigits && mobileDigits.length !== 10) {

        errors.mobile = 'Mobile Number must be exactly 10 digits';

      }

      if (altDigits && altDigits.length !== 10) {

        errors.alternateMobile = 'Alternate Mobile must be exactly 10 digits';

      }

      if (mobileDigits && altDigits && mobileDigits === altDigits) {

        errors.alternateMobile = 'Alternate Mobile must be different from Mobile Number';

      }



      if (address && (address.length < 5 || address.length > 250)) {

        errors.address = 'Address must be between 5 and 250 characters';

      }



      if (city && (city.length < 2 || city.length > 60 || !/^[a-zA-Z\s.\-']+$/.test(city))) {

        errors.city = 'City must be 2-60 characters and contain only letters';

      }



      if (pincodeDigits && pincodeDigits.length !== 6) {

        errors.pincode = 'Pincode must be exactly 6 digits';

      }



      return errors;

    };



    const errors = validateProfile();

    setFieldErrors(errors);



    if (Object.keys(errors).length > 0) {

      setSaveMessage('Please fix the highlighted fields before saving.');

      setIsLoading(false);

      return;

    }

    

    try {

      // Get token from store or localStorage

      const storedToken = token || localStorage.getItem('token');

      

      if (!storedToken) {

        setSaveMessage('Error: No authentication token found. Please log in again.');

        setIsLoading(false);

        return;

      }



      const response = await fetch('/api/auth/profile', {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${storedToken}`,

        },

        body: JSON.stringify(profileData),

      });

      

      if (response.ok) {

        const updatedUser = await response.json();

        // Update the user in the store

        const { login } = useStore.getState();

        login(updatedUser, storedToken);

        

        setSaveMessage('Profile updated successfully!');

        setTimeout(() => {

          setSaveMessage('');

          setIsEditing(false);

        }, 2000);

      } else {

        const error = await response.json();

        setSaveMessage(`Error: ${error.error || 'Failed to update profile'}`);

      }

    } catch (error) {

      console.error('Profile update error:', error);

      setSaveMessage('Network error. Please try again.');

    } finally {

      setIsLoading(false);

    }

  };



  const handleInputChange = (field: keyof UserProfile, value: string) => {

    setProfileData(prev => ({ ...prev, [field]: value }));

    if (fieldErrors[field]) {

      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    }

  };



  if (!isLoggedIn || !user) {

    return (

      <PublicLayout>

        <div className="container mx-auto py-16 px-4">

        <h1 className="text-3xl font-bold mb-4">My Profile</h1>

        <p className="text-base text-muted-foreground mb-4">You need to login to view profile details.</p>

        <Link href="/login" className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">

          Go to Login

        </Link>

      </div>

    </PublicLayout>

    );

  }



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

        @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}

        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}

        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}

        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}

        .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}

        .profile-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 24px 56px hsl(var(--primary)/0.15)}

        .profile-card{transition:transform 0.3s ease,box-shadow 0.3s ease}

        .info-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}

        .info-card{transition:transform 0.25s ease,box-shadow 0.25s ease}

        .edit-btn:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 12px 32px hsl(var(--primary)/0.2)}

        .edit-btn{transition:transform 0.2s ease,box-shadow 0.2s ease}

        .input-field:focus{transform:scale(1.02);box-shadow:0 8px 24px hsl(var(--primary)/0.1)}

        .input-field{transition:transform 0.2s ease,box-shadow 0.2s ease}

        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}

        .spin-ring{animation:spinSlow 22s linear infinite}

      `}</style>



      <div className="min-h-screen relative overflow-hidden">

        {/* background gradient */}

        <div

          className="absolute inset-0 pointer-events-none"

          style={{

            background:

              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',

          }}

        />



        {/* floating orbs */}

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 380, height: 380, top: -80, right: -100,

            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',

            animation: 'float1 10s ease-in-out infinite',

          }}

        />

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 260, height: 260, bottom: 60, left: -80,

            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',

            animation: 'float2 8s ease-in-out infinite',

          }}

        />

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 180, height: 180, top: '40%', left: '5%',

            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',

            animation: 'float3 9s ease-in-out infinite',

          }}

        />



        {/* ── BANNER ── */}

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

          <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>

            <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />

          </div>

          <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>

            <div className="w-12 h-12 rounded-full border-2 border-white/20" />

          </div>

          <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>

            <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />

          </div>

          <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>

            <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />

          </div>

          {/* banner text */}

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">

            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">

              Morpankh Saree · My Profile

            </p>

            <h2 className="text-4xl font-bold mb-2">My Profile</h2>

            <p className="text-white/70 text-sm max-w-md">

              Manage your account settings, update your information, and customize your shopping experience.

            </p>

          </div>

        </div>



        {/* ── DRAGGABLE CONTENT ── */}

        <div

          className="container mx-auto px-4 py-12 relative z-10"

        >

          {/* page pill + title */}

          <div className="text-center mb-14 fade-up-1">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />

              Profile Management

            </div>

            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>

              

            </h1>

          </div>



          {/* MAIN PROFILE CARD */}

          <div className="max-w-5xl mx-auto mb-10 fade-up-2">

            <div

              className="profile-card rounded-2xl border border-border/60 shadow-xl backdrop-blur-xl overflow-hidden"

              style={{ background: 'hsl(var(--card)/0.85)' }}

            >

              <div className="p-8">

                <div className="flex flex-col lg:flex-row items-center gap-8">

                  {/* PROFILE IMAGE */}

                  <div className="relative group">

                    <div className="w-32 h-32 rounded-full p-1 shadow-xl transform transition-all duration-300 group-hover:scale-105" 

                      style={{ 

                        background: 'linear-gradient(160deg, hsl(var(--primary), hsl(var(--secondary)))',

                        border: '3px solid hsl(var(--primary)/0.3)'

                      }}>

                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">

                        <User className="w-16 h-16" style={{ color: 'hsl(var(--primary))' }} />

                      </div>

                    </div>

                    <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg" 

                      style={{ 

                        background: profileData.verified ? 'hsl(var(--success))' : 'hsl(var(--warning))',

                        border: '3px solid white'

                      }}>

                      <CheckCircle className="w-5 h-5 text-white" />

                    </div>

                  </div>



                  {/* BASIC INFO */}

                  <div className="flex-1 text-center lg:text-left">

                    <h2 className="text-3xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>{profileData.name}</h2>

                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" 

                        style={{ 

                          background: profileData.verified ? 'hsl(var(--success)/0.1)' : 'hsl(var(--warning)/0.1)',

                          color: profileData.verified ? 'hsl(var(--success))' : 'hsl(var(--warning))'

                        }}>

                        {profileData.verified ? (

                          <><CheckCircle className="w-4 h-4 mr-1" /> Verified</>

                        ) : (

                          <><XCircle className="w-4 h-4 mr-1" /> Not Verified</>

                        )}

                      </div>

                      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border border-primary/30" 

                        style={{ 

                          background: 'hsl(var(--primary)/0.08)',

                          color: 'hsl(var(--primary))'

                        }}>

                        ID: {profileData.id.slice(0, 8)}...

                      </div>

                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">

                      <Mail className="w-5 h-5" />

                      <span className="text-base">{profileData.email}</span>

                    </div>

                  </div>



                  {/* EDIT BUTTON */}

                  <div className="flex gap-3">

                    <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>

                      <DialogTrigger asChild>

                        <button

                          className="edit-btn inline-flex items-center gap-3 px-6 py-3 bg-secondary text-white text-sm font-medium rounded-xl shadow-lg"

                        >

                          <KeyRound className="w-5 h-5" />

                          Forgot Password

                        </button>

                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[500px] rounded-2xl border border-border/60" style={{ background: 'hsl(var(--card)/0.95)' }}>

                        <DialogHeader className="border-b border-border/60 pb-4">

                          <DialogTitle className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>

                            Forgot Password

                          </DialogTitle>

                        </DialogHeader>

                        <div className="space-y-6 p-6">

                          {/* Email Display (Read-only) */}

                          <div>

                            <Label htmlFor="email" className="text-sm font-medium">Registered Email</Label>

                            <Input

                              id="email"

                              type="email"

                              value={profileData.email}

                              disabled

                              className="mt-2 rounded-xl border border-border bg-muted"

                            />

                          </div>



                          {/* OTP Section */}

                          {!otpVerified && (

                            <div className="space-y-4">

                              <div>

                                <Label htmlFor="otp" className="text-sm font-medium">OTP</Label>

                                <Input

                                  id="otp"

                                  type="text"

                                  placeholder="Enter 6-digit OTP"

                                  value={otp}

                                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}

                                  maxLength={6}

                                  className="mt-2 rounded-xl border border-border"

                                  disabled={!otpSent}

                                />

                              </div>



                              <div className="flex gap-3">

                                {!otpSent ? (

                                  <button

                                    type="button"

                                    onClick={handleSendOtp}

                                    disabled={isSendingOtp}

                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                                  >

                                    {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}

                                  </button>

                                ) : (

                                  <>

                                    <button

                                      type="button"

                                      onClick={handleVerifyOtp}

                                      disabled={isVerifyingOtp || otp.length !== 6}

                                      className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                                    >

                                      {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}

                                    </button>

                                    {otpCountdown > 0 ? (

                                      <button

                                        type="button"

                                        disabled

                                        className="px-4 py-3 bg-muted text-muted-foreground rounded-xl font-medium"

                                      >

                                        Resend in {otpCountdown}s

                                      </button>

                                    ) : (

                                      <button

                                        type="button"

                                        onClick={handleSendOtp}

                                        disabled={isSendingOtp}

                                        className="px-4 py-3 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                                      >

                                        {isSendingOtp ? 'Sending...' : 'Resend OTP'}

                                      </button>

                                    )}

                                  </>

                                )}

                              </div>

                            </div>

                          )}



                          {/* Password Section (Enabled after OTP verification) */}

                          {otpVerified && (

                            <div className="space-y-4">

                              <div>

                                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>

                                <Input

                                  id="newPassword"

                                  type="password"

                                  placeholder="Enter new password"

                                  value={newPassword}

                                  onChange={(e) => {

                                    setNewPassword(e.target.value);

                                    validatePassword(e.target.value, confirmPassword);

                                  }}

                                  className="mt-2 rounded-xl border border-border"

                                />

                              </div>



                              <div>

                                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>

                                <Input

                                  id="confirmPassword"

                                  type="password"

                                  placeholder="Confirm new password"

                                  value={confirmPassword}

                                  onChange={(e) => {

                                    setConfirmPassword(e.target.value);

                                    validatePassword(newPassword, e.target.value);

                                  }}

                                  className="mt-2 rounded-xl border border-border"

                                />

                              </div>



                              {passwordError && (

                                <p className="text-xs text-red-600">{passwordError}</p>

                              )}



                              <div className="text-xs text-muted-foreground space-y-1">

                                <p>Password must contain:</p>

                                <ul className="list-disc list-inside space-y-1">

                                  <li>Minimum 8 characters</li>

                                  <li>At least one uppercase letter</li>

                                  <li>At least one lowercase letter</li>

                                  <li>At least one number</li>

                                  <li>At least one special character</li>

                                </ul>

                              </div>



                              <button

                                type="button"

                                onClick={handleResetPassword}

                                disabled={isSavingPassword || !!passwordError || !newPassword || !confirmPassword}

                                className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                              >

                                {isSavingPassword ? 'Saving...' : 'Save Password'}

                              </button>

                            </div>

                          )}

                        </div>

                      </DialogContent>

                    </Dialog>



                    <Dialog open={isEditing} onOpenChange={setIsEditing}>

                      <DialogTrigger asChild>

                        <button

                          className="edit-btn inline-flex items-center gap-3 px-6 py-3 bg-primary text-white text-sm font-medium rounded-xl shadow-lg"

                        >

                          <Edit3 className="w-5 h-5" />

                          Edit Profile

                        </button>

                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border/60" style={{ background: 'hsl(var(--card)/0.95)' }}>

                        <DialogHeader className="border-b border-border/60 pb-4">

                          <DialogTitle className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>

                            Edit Profile

                          </DialogTitle>

                        </DialogHeader>

                        <form onSubmit={handleProfileUpdate} className="space-y-6 p-6">

                          <Tabs defaultValue="basic" className="w-full">

                            <TabsList className="grid w-full grid-cols-2 mb-6">

                              <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-white">Basic Info</TabsTrigger>

                              <TabsTrigger value="contact" className="data-[state=active]:bg-primary data-[state=active]:text-white">Contact Details</TabsTrigger>

                            </TabsList>

                            

                            <TabsContent value="basic" className="space-y-5">

                              <div>

                                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>

                                <Input

                                  id="name"

                                  value={profileData.name}

                                  onChange={(e) => handleInputChange('name', e.target.value)}

                                  className="input-field mt-2 rounded-xl border border-border"

                                />

                              </div>

                              <div>

                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>

                                <Input

                                  id="email"

                                  type="email"

                                  value={profileData.email}

                                  onChange={(e) => handleInputChange('email', e.target.value)}

                                  className="input-field mt-2 rounded-xl border border-border"

                                />

                              </div>

                            </TabsContent>

                            

                            <TabsContent value="contact" className="space-y-5">

                              <div>

                                <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>

                                <Input

                                  id="mobile"

                                  type="tel"

                                  inputMode="numeric"

                                  pattern="[0-9]*"

                                  maxLength={10}

                                  placeholder="10-digit mobile number"

                                  value={profileData.mobile}

                                  onChange={(e) => handleInputChange('mobile', e.target.value)}

                                  className="input-field mt-2 rounded-xl border border-border"

                                />

                                {fieldErrors.mobile && (

                                  <p className="mt-2 text-xs text-red-600">{fieldErrors.mobile}</p>

                                )}

                              </div>

                              <div>

                                <Label htmlFor="alternateMobile" className="text-sm font-medium">Alternate Mobile</Label>

                                <Input

                                  id="alternateMobile"

                                  type="tel"

                                  inputMode="numeric"

                                  pattern="[0-9]*"

                                  maxLength={10}

                                  placeholder="10-digit alternate number"

                                  value={profileData.alternateMobile}

                                  onChange={(e) => handleInputChange('alternateMobile', e.target.value)}

                                  className="input-field mt-2 rounded-xl border border-border"

                                />

                                {fieldErrors.alternateMobile && (

                                  <p className="mt-2 text-xs text-red-600">{fieldErrors.alternateMobile}</p>

                                )}

                              </div>

                              <div>

                                <Label htmlFor="address" className="text-sm font-medium">Address</Label>

                                <Textarea

                                  id="address"

                                  value={profileData.address}

                                  onChange={(e) => handleInputChange('address', e.target.value)}

                                  className="input-field mt-2 rounded-xl border border-border"

                                  rows={3}

                                />

                                {fieldErrors.address && (

                                  <p className="mt-2 text-xs text-red-600">{fieldErrors.address}</p>

                                )}

                              </div>

                              <div className="grid grid-cols-2 gap-4">

                                <div>

                                  <Label htmlFor="city" className="text-sm font-medium">City</Label>

                                  <Input

                                    id="city"

                                    value={profileData.city}

                                    onChange={(e) => handleInputChange('city', e.target.value)}

                                    className="input-field mt-2 rounded-xl border border-border"

                                  />

                                  {fieldErrors.city && (

                                    <p className="mt-2 text-xs text-red-600">{fieldErrors.city}</p>

                                  )}

                                </div>

                                <div>

                                  <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>

                                  <Input

                                    id="pincode"

                                    inputMode="numeric"

                                    pattern="[0-9]*"

                                    maxLength={6}

                                    placeholder="6-digit pincode"

                                    value={profileData.pincode}

                                    onChange={(e) => handleInputChange('pincode', e.target.value)}

                                    className="input-field mt-2 rounded-xl border border-border"

                                  />

                                  {fieldErrors.pincode && (

                                    <p className="mt-2 text-xs text-red-600">{fieldErrors.pincode}</p>

                                  )}

                                </div>

                              </div>

                            </TabsContent>

                          </Tabs>

                           

                          <div className="flex gap-3 pt-6">

                            <button 

                              type="submit" 

                              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium" 

                              disabled={isLoading}

                            >

                              {isLoading ? 'Saving...' : 'Save Changes'}

                            </button>

                            <button 

                              type="button" 

                              onClick={() => setIsEditing(false)} 

                              disabled={isLoading}

                              className="px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"

                            >

                              Cancel

                            </button>

                          </div>

                           

                          {saveMessage && (

                            <div className={`mt-4 p-4 rounded-xl text-sm ${

                              saveMessage.includes('success') 

                                ? 'bg-green-50 text-green-800 border border-green-200' 

                                : 'bg-red-50 text-red-800 border border-red-200'

                            }`}>

                              {saveMessage}

                            </div>

                          )}

                        </form>

                      </DialogContent>

                    </Dialog>

                  </div>

                </div>

              </div>

            </div>

          </div>



          {/* INFORMATION CARDS */}

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up-3">

            {/* CONTACT INFORMATION CARD */}

            <div className="info-card rounded-2xl border border-border/60 shadow-xl backdrop-blur-xl overflow-hidden" style={{ background: 'hsl(var(--card)/0.85)' }}>

              <div className="p-6">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary)/0.1)' }}>

                    <Phone className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />

                  </div>

                  <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--primary))' }}>Contact Information</h3>

                </div>

                <div className="space-y-4">

                  <div className="flex justify-between items-center py-3 border-b border-border/30">

                    <span className="text-muted-foreground">Mobile</span>

                    <span className="font-medium">{profileData.mobile || 'Not provided'}</span>

                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-border/30">

                    <span className="text-muted-foreground">Alternate Mobile</span>

                    <span className="font-medium">{profileData.alternateMobile || 'Not provided'}</span>

                  </div>

                  <div className="flex justify-between items-center py-3">

                    <span className="text-muted-foreground">Email</span>

                    <span className="font-medium">{profileData.email}</span>

                  </div>

                </div>

              </div>

            </div>



            {/* ADDRESS INFORMATION CARD */}

            <div className="info-card rounded-2xl border border-border/60 shadow-xl backdrop-blur-xl overflow-hidden" style={{ background: 'hsl(var(--card)/0.85)' }}>

              <div className="p-6">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--secondary)/0.1)' }}>

                    <MapPin className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />

                  </div>

                  <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--primary))' }}>Address Information</h3>

                </div>

                <div className="space-y-4">

                  <div className="flex justify-between items-center py-3 border-b border-border/30">

                    <span className="text-muted-foreground">Address</span>

                    <span className="font-medium text-right max-w-[60%]">{profileData.address || 'Not provided'}</span>

                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-border/30">

                    <span className="text-muted-foreground">City</span>

                    <span className="font-medium">{profileData.city || 'Not provided'}</span>

                  </div>

                  <div className="flex justify-between items-center py-3">

                    <span className="text-muted-foreground">Pincode</span>

                    <span className="font-medium">{profileData.pincode || 'Not provided'}</span>

                  </div>

                </div>

              </div>

            </div>



          </div>

        </div>

      </div>

    </PublicLayout>

  );

};



export default ProfilePage;