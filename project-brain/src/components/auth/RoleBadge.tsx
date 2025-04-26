import { UserRole } from '@/lib/auth';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  // Define style configurations for each role
  const roleConfig = {
    admin: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    director: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800'
    },
    team: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    client: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    builder: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800'
    }
  };

  // Define size styles
  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5'
  };

  const config = roleConfig[role];
  
  return (
    <span
      className={`
        inline-flex items-center justify-center 
        font-medium rounded-md border 
        ${config.bg} ${config.text} ${config.border} ${sizeStyles[size]}
      `}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

/**
 * Component to display a list of permissions with appropriate styling
 */
export function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span
      className="
        inline-flex items-center justify-center 
        text-xs font-medium rounded-md border 
        bg-gray-100 text-gray-800 border-gray-200
        dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700
        px-1.5 py-0.5 mr-1 mb-1
      "
    >
      {permission}
    </span>
  );
}

/**
 * Component to render a grid of permission badges
 */
export function PermissionList({ permissions }: { permissions: string[] }) {
  if (!permissions.length) {
    return <span className="text-gray-500 text-sm">No permissions</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {permissions.map((permission) => (
        <PermissionBadge key={permission} permission={permission} />
      ))}
    </div>
  );
} 