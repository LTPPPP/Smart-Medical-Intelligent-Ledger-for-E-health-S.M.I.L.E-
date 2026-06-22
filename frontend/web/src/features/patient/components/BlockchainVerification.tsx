'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { api } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import type { MedicalRecord } from '../types/patient.type';

interface BlockchainVerificationProps {
  record: MedicalRecord;
}

interface VerificationResult {
  verified: boolean;
  blockchainHash?: string;
  timestamp?: string;
  message?: string;
}

export function BlockchainVerification({ record }: BlockchainVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.get(API_ENDPOINTS.BLOCKCHAIN.VERIFY(record.id));
      setResult(data as VerificationResult);
    } catch (err) {
      setError('Không thể kết nối blockchain để xác thực');
      console.error('Blockchain verify error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] overflow-hidden">
      {/* Green gradient header */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-none">
              <Icon icon="mdi:shield-check" width={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác thực Blockchain</h3>
              <p className="text-sm text-emerald-100">Kiểm tra tính toàn vẹn của bệnh án</p>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white text-teal-700 font-semibold rounded-xl shadow-md hover:brightness-95 hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-sm"
          >
            {isVerifying ? (
              <Icon icon="line-md:loading-twotone-loop" width={18} />
            ) : (
              <Icon icon="mdi:shield-refresh" width={18} />
            )}
            {isVerifying ? 'Đang xác thực...' : 'Xác thực ngay'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Stored hash */}
        {record.blockchainHash && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
              Hash đã lưu
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600 break-all">
              {record.blockchainHash}
            </div>
          </div>
        )}

        {/* Verification result */}
        {result && (
          <div
            className={`rounded-xl p-4 flex items-start gap-3 ${
              result.verified
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <Icon
              icon={result.verified ? 'mdi:check-circle' : 'mdi:close-circle'}
              width={24}
              className={`flex-none mt-0.5 ${result.verified ? 'text-emerald-600' : 'text-red-600'}`}
            />
            <div>
              <p
                className={`font-semibold text-sm ${
                  result.verified ? 'text-emerald-800' : 'text-red-800'
                }`}
              >
                {result.verified
                  ? 'Bệnh án hợp lệ — Không bị sửa đổi'
                  : 'Cảnh báo: Bệnh án có thể đã bị sửa đổi'}
              </p>
              {result.timestamp && (
                <p className="text-xs text-slate-600 mt-1">
                  Thời điểm xác thực:{' '}
                  {new Date(result.timestamp).toLocaleString('vi-VN')}
                </p>
              )}
              {result.message && (
                <p className="text-xs text-slate-600 mt-1">{result.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <Icon icon="mdi:alert-circle" width={22} className="text-red-500 flex-none mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Bệnh án được lưu trữ trên blockchain khi hoàn tất (FINALIZED). Xác thực so sánh hash
          hiện tại với bản gốc trên chuỗi khối.
        </p>
      </div>
    </div>
  );
}
