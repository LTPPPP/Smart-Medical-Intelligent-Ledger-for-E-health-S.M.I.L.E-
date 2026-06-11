'use client';

import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  bgColor,
  trend,
}: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
      >
        <Icon icon={icon} width={24} className={color} />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <Icon
            icon={trend.isPositive ? 'mdi:trending-up' : 'mdi:trending-down'}
            width={16}
          />
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
  </div>
);

export const PatientDashboard = () => {
  const { usePatients } = usePatient();

  // Fetch all patients with different filters
  const { data: allPatientsData, isLoading: loadingAll } = usePatients({
    size: 1000,
  });
  const { data: activePatientsData } = usePatients({
    status: 'ACTIVE',
    size: 1000,
  });
  const { data: registeredPatientsData } = usePatients({
    patientType: 'REGISTERED',
    size: 1000,
  });
  const { data: allergicPatientsData } = usePatients({
    hasAllergies: true,
    size: 1000,
  });

  const allPatients = allPatientsData?.data?.content || [];
  const activePatients = activePatientsData?.data?.content || [];
  const registeredPatients = registeredPatientsData?.data?.content || [];
  const allergicPatients = allergicPatientsData?.data?.content || [];

  // Calculate statistics
  const totalPatients = allPatients.length;
  const totalActive = activePatients.length;
  const totalRegistered = registeredPatients.length;
  const totalWithAllergies = allergicPatients.length;

  // Age distribution
  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const ageDistribution = allPatients.reduce(
    (acc, patient) => {
      const age = getAge(patient.dateOfBirth);
      if (age < 18) acc.children++;
      else if (age < 40) acc.adults++;
      else if (age < 60) acc.middleAge++;
      else acc.seniors++;
      return acc;
    },
    { children: 0, adults: 0, middleAge: 0, seniors: 0 },
  );

  // Gender distribution
  const genderDistribution = allPatients.reduce(
    (acc, patient) => {
      acc[patient.gender]++;
      return acc;
    },
    { MALE: 0, FEMALE: 0, OTHER: 0 },
  );

  // Blood type distribution
  const bloodTypeDistribution = allPatients.reduce(
    (acc, patient) => {
      if (patient.bloodType) {
        acc[patient.bloodType] = (acc[patient.bloodType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  // Insurance statistics
  const withInsurance = allPatients.filter(
    (p) => p.insuranceNumber && p.insuranceNumber.trim() !== '',
  ).length;

  if (loadingAll) {
    return <Loading text="Đang tải thống kê..." />;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số bệnh nhân"
          value={totalPatients}
          icon="mdi:account-group"
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Đang điều trị"
          value={totalActive}
          icon="mdi:account-check"
          color="text-green-600"
          bgColor="bg-green-100"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Đã đăng ký"
          value={totalRegistered}
          icon="mdi:account-plus"
          color="text-purple-600"
          bgColor="bg-purple-100"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Có dị ứng"
          value={totalWithAllergies}
          icon="mdi:alert-circle"
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-bar" width={24} />
            Phân bố theo độ tuổi
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Trẻ em (<18)',
                value: ageDistribution.children,
                color: 'bg-blue-500',
              },
              {
                label: 'Trẻ trung (18-39)',
                value: ageDistribution.adults,
                color: 'bg-green-500',
              },
              {
                label: 'Trung niên (40-59)',
                value: ageDistribution.middleAge,
                color: 'bg-orange-500',
              },
              {
                label: 'Cao tuổi (≥60)',
                value: ageDistribution.seniors,
                color: 'bg-purple-500',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value} (
                    {totalPatients > 0
                      ? Math.round((item.value / totalPatients) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{
                      width: `${totalPatients > 0 ? (item.value / totalPatients) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:gender-male-female" width={24} />
            Phân bố theo giới tính
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Nam',
                value: genderDistribution.MALE,
                color: 'bg-blue-500',
                icon: 'mdi:gender-male',
              },
              {
                label: 'Nữ',
                value: genderDistribution.FEMALE,
                color: 'bg-pink-500',
                icon: 'mdi:gender-female',
              },
              {
                label: 'Khác',
                value: genderDistribution.OTHER,
                color: 'bg-gray-500',
                icon: 'mdi:gender-male-female-variant',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={item.icon}
                      width={16}
                      className="text-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value} (
                    {totalPatients > 0
                      ? Math.round((item.value / totalPatients) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{
                      width: `${totalPatients > 0 ? (item.value / totalPatients) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blood Type Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:water" width={24} />
            Nhóm máu
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(bloodTypeDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="bg-gray-50 rounded-lg p-3 text-center"
                >
                  <div className="text-2xl font-bold text-red-600">{type}</div>
                  <div className="text-sm text-gray-600">{count} BN</div>
                </div>
              ))}
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:shield-account" width={24} />
            Bảo hiểm y tế
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Có BHYT</span>
              </div>
              <span className="font-bold text-gray-900">{withInsurance}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700">Không BHYT</span>
              </div>
              <span className="font-bold text-gray-900">
                {totalPatients - withInsurance}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="text-sm text-gray-600 mb-2">Tỷ lệ tham gia</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${totalPatients > 0 ? (withInsurance / totalPatients) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="text-right text-sm font-bold text-gray-900 mt-1">
                {totalPatients > 0
                  ? Math.round((withInsurance / totalPatients) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="mdi:information" width={24} />
            Thông tin nhanh
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-100 text-sm">Khám trực tiếp</span>
              <span className="font-bold">
                {totalPatients - totalRegistered}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-100 text-sm">Không hoạt động</span>
              <span className="font-bold">{totalPatients - totalActive}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-100 text-sm">Có dị ứng</span>
              <span className="font-bold">{totalWithAllergies}</span>
            </div>
            <div className="pt-3 border-t border-blue-500">
              <div className="text-blue-100 text-sm mb-1">Tỷ lệ dị ứng</div>
              <div className="text-2xl font-bold">
                {totalPatients > 0
                  ? Math.round((totalWithAllergies / totalPatients) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
