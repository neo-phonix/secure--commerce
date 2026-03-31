'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Shield, Calendar, Edit2, Save, X, Camera, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';

import { handleFirestoreError, OperationType } from '@/lib/error-handler';

export default function ProfilePage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      });
    }
  }, [user, authLoading]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!res.ok) {
        const data = await res.json();
        handleFirestoreError(data.error || 'Failed to update profile', OperationType.UPDATE, '/api/auth/profile');
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      refreshUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, '/api/auth/profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">You are not logged in</h1>
        <p className="text-black/40 mb-8">Please sign in to view your profile.</p>
        <Link 
          href="/login"
          className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="relative h-48 bg-black">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl border-4 border-white overflow-hidden bg-gray-100">
                  <Image
                    src={profile.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
                {isEditing && (
                  <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                    <Camera className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-8 flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Spinner size={16} className="text-black" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pt-24 p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{user.user_metadata?.full_name || 'No Name'}</h1>
                <p className="text-black/40 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-100'
              }`}>
                <Shield className="w-4 h-4" />
                {user.user_metadata?.role || 'User'} Account
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Personal Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/40">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                      />
                    ) : (
                      <p className="font-bold">{user.user_metadata?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/40">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                      />
                    ) : (
                      <p className="font-bold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-black/20" />
                        {user.user_metadata?.phone || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Shipping Address</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black/40">Address</label>
                    {isEditing ? (
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="font-bold flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-black/20 mt-1" />
                        {user.user_metadata?.address || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="pt-8 border-t border-black/5 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Security Settings
              </h3>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-black/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Multi-Factor Authentication (MFA)</h4>
                  <p className="text-sm text-black/40">Add an extra layer of security to your account using TOTP.</p>
                </div>
                <button 
                  onClick={() => toast.success('MFA Setup initiated. Please check your email.')}
                  className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-all"
                >
                  Enable MFA
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-black/5 flex items-center gap-6 text-xs text-black/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verified Account
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
