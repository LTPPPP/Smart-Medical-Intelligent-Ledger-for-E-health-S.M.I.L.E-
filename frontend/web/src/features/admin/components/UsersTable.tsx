import { useState } from 'react';

import { Icon } from '@iconify/react';

import { UserManagement } from '@/features/admin/types/admin.type';

interface UsersTableProps {
  data: UserManagement[];
  onLock: (user: UserManagement) => void;
  onUnlock: (user: UserManagement) => void;
  onEditRoles: (user: UserManagement) => void;
  isLocking?: boolean;
  isUnlocking?: boolean;
}

export const UsersTable = ({ 
  data, 
  onLock, 
  onUnlock, 
  onEditRoles,
  isLocking,
  isUnlocking 
}: UsersTableProps) => {
  const [sortField, setSortField] = useState<keyof UserManagement | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof UserManagement) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      LOCKED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const SortIcon = ({ field }: { field: keyof UserManagement }) => {
    if (sortField !== field) return <Icon icon="mdi:unfold-more-horizontal" width={16} className="text-gray-400" />;
    return sortDirection === 'asc' 
      ? <Icon icon="mdi:arrow-up" width={16} className="text-blue-600" />
      : <Icon icon="mdi:arrow-down" width={16} className="text-blue-600" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('fullName')}
            >
              <div className="flex items-center gap-2">
                User
                <SortIcon field="fullName" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-2">
                Contact
                <SortIcon field="email" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Roles
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Verified
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedData.map((user) => (
            <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Icon icon="mdi:email" width={14} className="text-gray-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icon icon="mdi:phone" width={14} className="text-gray-400" />
                    {user.phone}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <span 
                      key={role}
                      className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadge(user.status)}`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {user.emailVerified && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <Icon icon="mdi:email-check" width={18} />
                      <span>Email</span>
                    </div>
                  )}
                  {user.phoneVerified && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <Icon icon="mdi:phone-check" width={18} />
                      <span>Phone</span>
                    </div>
                  )}
                  {!user.emailVerified && !user.phoneVerified && (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {user.status === 'LOCKED' ? (
                    <button
                      onClick={() => onUnlock(user)}
                      disabled={isUnlocking}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Unlock user"
                    >
                      <Icon icon="mdi:lock-open" width={20} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onLock(user)}
                      disabled={isLocking}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Lock user"
                    >
                      <Icon icon="mdi:lock" width={20} />
                    </button>
                  )}
                  <button
                    onClick={() => onEditRoles(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit roles"
                  >
                    <Icon icon="mdi:account-edit" width={20} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Icon icon="mdi:account-off" className="mx-auto mb-3 text-gray-300" width={48} />
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};