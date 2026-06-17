'use client';

import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';

export function PatientDashboard() {
  const { usePatients } = usePatient();
  const { data, isLoading } = usePatients();
  const patients = data?.data ?? [];

  const total = patients.length;
  const genderCounts = patients.reduce(
    (acc, p) => {
      if (p.gender === 'MALE') acc.male++;
      else if (p.gender === 'FEMALE') acc.female++;
      else acc.other++;
      return acc;
    },
    { male: 0, female: 0, other: 0 },
  );
  const withInsurance = patients.filter((p) => p.insuranceNumber).length;

  const stats = [
    {
      label: 'Total Patients',
      value: total,
      icon: 'mdi:account-multiple',
    },
    {
      label: 'Male',
      value: genderCounts.male,
      icon: 'mdi:gender-male',
    },
    {
      label: 'Female',
      value: genderCounts.female,
      icon: 'mdi:gender-female',
    },
    {
      label: 'With Insurance',
      value: withInsurance,
      icon: 'mdi:shield-check',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5 animate-pulse"
            >
              <div className="h-8 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const genderBars = [
    { label: 'Male', count: genderCounts.male, color: 'bg-teal-600' },
    { label: 'Female', count: genderCounts.female, color: 'bg-purple-500' },
    { label: 'Other', count: genderCounts.other, color: 'bg-slate-400' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-none">
                <Icon icon={stat.icon} width={22} className="text-teal-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Gender distribution */}
      <div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Gender Distribution</h3>
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
            {total} total
          </span>
        </div>

        {total > 0 ? (
          <div className="space-y-4">
            {genderBars.map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{g.label}</span>
                  <span className="text-slate-500">
                    {g.count}{' '}
                    <span className="text-slate-400">
                      ({total > 0 ? Math.round((g.count / total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${g.color} rounded-full transition-all duration-500`}
                    style={{ width: `${total > 0 ? (g.count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-slate-400">
            <Icon icon="mdi:chart-bar" width={40} className="mb-2 text-slate-300" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
