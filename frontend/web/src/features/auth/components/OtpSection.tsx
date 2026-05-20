'use client';
import { useState } from "react";
import { Input } from "@/shared/components/common/Input";

import { useAuth } from "@/features/auth/hooks/useAuth";

export const OtpSection = () => {
  const { sendOtp, verifyOtp, isSendingOtp, isVerifying } = useAuth();
  const [step, setStep] = useState<'SEND' | 'VERIFY'>('SEND');
  const [data, setData] = useState({ emailOrPhone: "", otpCode: "" });

  const handleSend = async () => {
    await sendOtp({ emailOrPhone: data.emailOrPhone, otpType: 'LOGIN' });
    setStep('VERIFY');
  };

  const handleVerify = async () => {
    await verifyOtp({ 
      emailOrPhone: data.emailOrPhone, 
      otpCode: data.otpCode, 
      otpType: 'LOGIN' 
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <h3 className="font-bold">Test OTP</h3>
      {step === 'SEND' ? (
        <div className="flex gap-2 items-end">
          <Input
            label="Phone / Email" 
            value={data.emailOrPhone}
            onChange={e => setData({...data, emailOrPhone: e.target.value})}
          />
          <button onClick={handleSend} disabled={isSendingOtp} className="bg-green-600 text-white px-4 py-2 rounded-md h-[42px]">
            {isSendingOtp ? "..." : "SEND"}
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-end">
          <Input 
            label="OTP CODE" 
            value={data.otpCode}
            onChange={e => setData({...data, otpCode: e.target.value})}
          />
          <button onClick={handleVerify} disabled={isVerifying} className="bg-orange-600 text-white px-4 py-2 rounded-md h-[42px]">
             {isVerifying ? "..." : "Confirm"}
          </button>
        </div>
      )}
    </div>
  );
};