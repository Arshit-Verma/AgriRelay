import React from "react";
import { Lock, MapPin, User, Sprout, MessageSquare, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { officer, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    officerId: '',
    password: '',
  });

  if (officer) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.officerId.trim() || !form.password) {
      toast.error('Enter your Officer ID and password to sign in.');
      return;
    }

    apiPost('/api/auth/login', {
      officerId: form.officerId.trim(),
      password: form.password,
    })
      .then(({ token, officer: signedInOfficer }) => {
        login({ ...signedInOfficer, token });
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.status === 401 ? 'Incorrect Officer ID or password.' : 'Could not reach the server. Check your connection and try again.');
      });
  };

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2" style={{ backgroundColor: '#F8F9F2' }}>
      
      {/* LEFT PANEL */}
      <section 
        className="hidden min-h-screen flex-col justify-between text-white lg:flex"
        style={{ backgroundColor: '#2D6A4F', padding: '48px 40px' }}
      >
        {/* TOP */}
        <div>
          <p className="font-extrabold text-[32px] text-white tracking-[-0.5px] font-sans">
            AgriRelay
          </p>
          <p className="mt-[6px] text-[15px] font-normal text-white/55 font-sans">
            Field intelligence. Farmer impact.
          </p>
        </div>

        {/* MIDDLE */}
        <div className="flex flex-grow items-center justify-center">
          <div 
            className="w-full max-w-xl"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              padding: '28px 24px',
              borderLeft: '3px solid rgba(255, 255, 255, 0.35)'
            }}
          >
            <p className="font-extrabold text-[38px] text-white leading-[1.1] font-sans">
              ₹92,651 crore in annual crop loss.
            </p>
            <p className="font-normal text-white font-sans" style={{ marginTop: '10px', opacity: 0.6, fontSize: '14px' }}>
              We&apos;re fixing the relay.
            </p>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex items-center gap-6" style={{ paddingLeft: '0px' }}>
          <div className="flex items-center gap-2 text-white/50 text-[13px] font-medium font-sans">
            <Sprout size={14} className="text-white/50" />
            <span>Crop intelligence</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-[13px] font-medium font-sans">
            <MapPin size={14} className="text-white/50" />
            <span>Zone-aware routing</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-[13px] font-medium font-sans">
            <MessageSquare size={14} className="text-white/50" />
            <span>SMS to 40M farmers</span>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#F8F9F2', padding: '64px 56px' }}>
        <div className="w-full max-w-[400px]">
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col" style={{ gap: '20px' }}>
            <div>
              <h1 className="text-[26px] font-bold text-[#1B1B1B] tracking-[-0.3px] font-sans">
                Officer Sign In
              </h1>
              <p className="mt-2 text-[14px] font-normal text-[#6B7280] font-sans">
                Access the field intelligence console for your assigned zone.
              </p>
            </div>

            <div className="flex flex-col" style={{ gap: '20px' }}>
              <label className="block">
                <span 
                  className="block font-sans"
                  style={{ fontStyle: 'normal', fontWeight: 600, fontSize: '11px', color: '#6B7280', uppercase: 'true', letterSpacing: '0.08em', marginBottom: '6px' }}
                >
                  OFFICER ID
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} aria-hidden="true" />
                  <input
                    type="text"
                    value={form.officerId}
                    onChange={updateField('officerId')}
                    placeholder="e.g. officer-004"
                    className="h-[44px] w-full bg-white rounded-[8px] border-[1.5px] border-[#E5E7EB] pl-10 pr-3 text-[15px] font-normal text-[#1B1B1B] outline-none transition duration-150 ease-in-out placeholder:text-[#9CA3AF]/70 focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/[0.12] font-sans"
                  />
                </div>
              </label>

              <label className="block">
                <span 
                  className="block font-sans"
                  style={{ fontStyle: 'normal', fontWeight: 600, fontSize: '11px', color: '#6B7280', uppercase: 'true', letterSpacing: '0.08em', marginBottom: '6px' }}
                >
                  PASSWORD
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} aria-hidden="true" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={updateField('password')}
                    className="h-[44px] w-full bg-white rounded-[8px] border-[1.5px] border-[#E5E7EB] pl-10 pr-3 text-[15px] font-normal text-[#1B1B1B] outline-none transition duration-150 ease-in-out focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/[0.12] font-sans"
                  />
                </div>
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#2D6A4F] px-4 text-[15px] font-semibold text-white transition duration-150 ease-in-out hover:bg-[#1B4D37] active:scale-[0.98] font-sans"
              >
                <span>Sign in</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              
              <p className="mt-4 text-center text-[12px] font-normal text-[#9CA3AF] font-sans">
                Pre-provisioned access only. Contact your district office.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}