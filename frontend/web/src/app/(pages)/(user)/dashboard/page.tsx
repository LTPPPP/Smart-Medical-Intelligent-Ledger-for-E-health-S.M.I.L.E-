'use client';
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuth } from "@/features/auth/hooks/useAuth";

import { Input } from "@/shared/components/common/Input";
import { GENDER_TYPE } from "@/shared/constants";
import { AppNavigation } from "@/shared/components/layout/AppNavigation";

export default function Dashboard() {
  const { user, accessToken } = useAuthStore();
  const { 
    logout, 
    isLoggingOut, 
    updateProfile, 
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
    verifyEmail,
    verifyPhone,
    sendOtp,
    isSendingOtp
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'profile' | 'password' | 'verify'>('info');
  
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    dateOfBirth: user?.dateOfBirth || "",
    gender: user?.gender || "MALE",
    address: ""
  });

  useEffect(()=>{
    if(user){
      setProfileForm({
        fullName: user?.fullName || "",
        dateOfBirth: user?.dateOfBirth || "",
        gender: user?.gender || "MALE",
        address: ""
      });
    }
  },[user])

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [verifyForm, setVerifyForm] = useState({
    emailOtp: "",
    phoneOtp: ""
  });

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(profileForm);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      alert("Failed to change password");
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      await sendOtp({ emailOrPhone: user?.email || "", otpType: 'EMAIL_VERIFY' });
      alert("OTP sent to email!");
    } catch (error) {
      alert("Failed to send OTP");
    }
  };

  const handleSendPhoneOtp = async () => {
    try {
      await sendOtp({ emailOrPhone: user?.phone || "", otpType: 'PHONE_VERIFY' });
      alert("OTP sent to phone!");
    } catch (error) {
      alert("Failed to send OTP");
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail({ 
        emailOrPhone: user?.email || "", 
        otpCode: verifyForm.emailOtp,
        otpType: 'EMAIL_VERIFY'
      });
      alert("Email verified!");
    } catch (error) {
      alert("Failed to verify email");
    }
  };

  const handleVerifyPhone = async () => {
    try {
      await verifyPhone({ 
        emailOrPhone: user?.phone || "", 
        otpCode: verifyForm.phoneOtp,
        otpType: 'PHONE_VERIFY'
      });
      alert("Phone verified!");
    } catch {
      alert("Failed to verify phone");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.fullName}!</p>
          </div>
          <button 
            onClick={() => logout()} 
            disabled={isLoggingOut}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            {isLoggingOut && <Icon icon="line-md:loading-twotone-loop" />}
            Logout
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b">
            {['info', 'profile', 'password', 'verify'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-4">User Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID:</strong> {user?.userId}</p>
                      <p><strong>Username:</strong> {user?.username}</p>
                      <p><strong>Email:</strong> {user?.email} {user?.emailVerified && <span className="text-green-600">✓</span>}</p>
                      <p><strong>Phone:</strong> {user?.phone} {user?.phoneVerified && <span className="text-green-600">✓</span>}</p>
                      <p><strong>Gender:</strong> {user?.gender}</p>
                      <p><strong>Status:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{user?.status}</span></p>
                    </div>
                  </div>

                  <div className="p-6 bg-green-50 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-4">Access Token</h3>
                    <p className="break-all text-[10px] font-mono bg-white p-4 rounded-lg max-h-40 overflow-auto">
                      {accessToken}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-4">Roles & Permissions</h3>
                  <div className="flex gap-2 mb-3">
                    {user?.roles.map(role => (
                      <span key={role} className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user?.permissions.map(permission => (
                      <span key={permission} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-xl font-bold mb-4">Update Profile</h3>
                
                <Input 
                  label="Full Name"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                />

                <Input 
                  label="Date of Birth"
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={e => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select 
                    className="px-3 py-2 border rounded-md"
                    value={profileForm.gender}
                    onChange={e => setProfileForm({...profileForm, gender: e.target.value as GENDER_TYPE})}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <Input 
                  label="Address"
                  value={profileForm.address}
                  onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                />

                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {isUpdatingProfile && <Icon icon="line-md:loading-twotone-loop" />}
                  Update Profile
                </button>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                
                <Input 
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                />

                <Input 
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />

                <Input 
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                />

                <button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {isChangingPassword && <Icon icon="line-md:loading-twotone-loop" />}
                  Change Password
                </button>
              </div>
            )}

            {activeTab === 'verify' && (
              <div className="space-y-6 max-w-2xl">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Verify Email</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Email: <strong>{user?.email}</strong> 
                    {user?.emailVerified ? <span className="text-green-600 ml-2">✓ Verified</span> : <span className="text-orange-600 ml-2">Not verified</span>}
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={handleSendEmailOtp}
                      disabled={isSendingOtp || user?.emailVerified}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {isSendingOtp ? <Icon icon="line-md:loading-twotone-loop" /> : "Send OTP"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      label=""
                      placeholder="Enter OTP"
                      value={verifyForm.emailOtp}
                      onChange={e => setVerifyForm({...verifyForm, emailOtp: e.target.value})}
                      disabled={user?.emailVerified}
                    />
                    <button 
                      onClick={handleVerifyEmail}
                      disabled={user?.emailVerified}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 h-[42px]"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Verify Phone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Phone: <strong>{user?.phone}</strong>
                    {user?.phoneVerified ? <span className="text-green-600 ml-2">✓ Verified</span> : <span className="text-orange-600 ml-2">Not verified</span>}
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={handleSendPhoneOtp}
                      disabled={isSendingOtp || user?.phoneVerified}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {isSendingOtp ? <Icon icon="line-md:loading-twotone-loop" /> : "Send OTP"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      label=""
                      placeholder="Enter OTP"
                      value={verifyForm.phoneOtp}
                      onChange={e => setVerifyForm({...verifyForm, phoneOtp: e.target.value})}
                      disabled={user?.phoneVerified}
                    />
                    <button 
                      onClick={handleVerifyPhone}
                      disabled={user?.phoneVerified}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 h-[42px]"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}