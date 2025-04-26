'use client';

import { useState } from 'react';
import { updateUserRole } from '@/lib/actions/role-management';

type UserRole = 'admin' | 'director' | 'team' | 'client' | 'builder';

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
}

export default function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
  const [role, setRole] = useState<UserRole>(currentRole as UserRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === role) return;
    
    try {
      setIsUpdating(true);
      setMessage(null);
      
      const result = await updateUserRole(userId, newRole);
      
      if (result.success) {
        setRole(newRole);
        setMessage({ text: 'Role updated successfully', type: 'success' });
      } else {
        setMessage({ text: result.error || 'Failed to update role', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          disabled={isUpdating}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="director">Director</option>
          <option value="team">Team</option>
          <option value="client">Client</option>
          <option value="builder">Builder</option>
        </select>
        
        {isUpdating && (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900"></div>
        )}
      </div>
      
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
} 