'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { UsersResponse } from '@/types/users.types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, CheckIcon } from 'lucide-react';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  hasFreeAccess?: boolean;
};

type Permission = {
  id: string;
  userId: number;
};

export default function GrantAccessPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [grantedUserIds, setGrantedUserIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [grantingUserIds, setGrantingUserIds] = useState<Set<number>>(
    new Set(),
  );

  // Load list of users with access on mount
  useEffect(() => {
    loadGrantedUsers();
  }, []);

  const loadGrantedUsers = async () => {
    try {
      const permissions = await apiFetch<Permission[]>(
        '/admin/manage-access/free-access',
      );
      const userIds = new Set(permissions.map((p) => p.userId));
      setGrantedUserIds(userIds);
    } catch (err) {
      console.error('Failed to load granted users:', err);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setLoading(true);
    try {
      const searchTrimmed = search.trim();
      const encodedSearch = encodeURIComponent(searchTrimmed);
      const res = await apiFetch<UsersResponse>(
        `/admin/users?search=${encodedSearch}&role=user&isVerified=true&page=1&limit=100`,
        { headers: { accept: 'application/json' } },
      );
      let usersArray = res.items || [];

      if (searchTrimmed) {
        const searchLower = searchTrimmed.toLowerCase();
        const searchAsNumber = Number(searchTrimmed);
        const isNumericSearch = !isNaN(searchAsNumber) && searchTrimmed !== '';

        usersArray = usersArray.filter((u) => {
          if (isNumericSearch) {
            return u.id === searchAsNumber;
          }

          const firstName = (u.firstName || '').toLowerCase();
          const lastName = (u.lastName || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();

          return (
            email.includes(searchLower) ||
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            fullName.includes(searchLower)
          );
        });
      }

      // Sort by ID in ascending order
      const sortedUsers = [...usersArray].sort((a, b) => a.id - b.id);
      setUsers(sortedUsers);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (userId: number) => {
    // Prevent duplicate requests
    if (grantingUserIds.has(userId) || grantedUserIds.has(userId)) {
      return;
    }

    setGrantingUserIds((prev) => new Set(prev).add(userId));

    try {
      const res = await apiFetch<User>('/admin/manage-access/free-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.toString() }),
      });

      // Check if response is valid and contains user ID
      if (res && res.id) {
        // Add user to the list of those who have been granted access
        setGrantedUserIds((prev) => new Set(prev).add(userId));

        // Update user state in the list
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, hasFreeAccess: true } : u,
          ),
        );
      } else {
        console.error('Invalid response from server:', res);
      }
    } catch (err: any) {
      console.error('Failed to grant access:', err);
      // Optionally show error to user (but user requested no status messages)
    } finally {
      // Remove from granting set
      setGrantingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasAccess = (userId: number) => {
    return grantedUserIds.has(userId);
  };

  return (
    <main className="p-8 max-w-md">
      <Button className="bg-gray-500" onClick={handleBack}>
        <ArrowLeftIcon />
        Back
      </Button>
      <h1 className="text-xl mb-4">Grant Access</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search user"
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-gray-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {users.length === 0 && hasSearched && !loading && (
        <p className="text-gray-500 text-sm mb-4">No users found</p>
      )}

      <ul className="space-y-2">
        {users.map((u) => {
          const userHasAccess = hasAccess(u.id) || u.hasFreeAccess;
          const isGranting = grantingUserIds.has(u.id);
          const isDisabled = userHasAccess || isGranting;
          return (
            <li
              key={u.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>
                {u.firstName} {u.lastName} ({u.email})
              </span>
              <button
                onClick={() => handleGrant(u.id)}
                disabled={isDisabled}
                className={`px-3 py-1 rounded text-white ${
                  userHasAccess
                    ? 'bg-green-500 cursor-not-allowed opacity-75'
                    : isGranting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {userHasAccess ? (
                  <span className="flex items-center gap-1">
                    <CheckIcon className="w-4 h-4" />
                    Access Granted
                  </span>
                ) : isGranting ? (
                  'Granting...'
                ) : (
                  'Grant Access'
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
