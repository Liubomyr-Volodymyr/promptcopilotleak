'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';

type Permission = {
  id: string;
  userId: number;
  permanent: boolean;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar: string | null;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export default function ManagePermissionsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'userId'>('userId');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    fetchData();
  }, []);

  // Re-sort items when sortBy or order changes
  useEffect(() => {
    if (items.length > 0) {
      const sortedItems = [...items].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'userId') {
          comparison = a.user.id - b.user.id;
        } else if (sortBy === 'id') {
          comparison = a.id.localeCompare(b.id);
        }
        return order === 'ASC' ? comparison : -comparison;
      });
      setItems(sortedItems);
    }
  }, [sortBy, order]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Permission[]>(
        '/admin/manage-access/free-access',
      );
      const itemsArray = res || [];

      // Sort items based on sortBy and order
      const sortedItems = [...itemsArray].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'userId') {
          comparison = a.user.id - b.user.id;
        } else if (sortBy === 'id') {
          // Compare permission IDs as strings
          comparison = a.id.localeCompare(b.id);
        }
        return order === 'ASC' ? comparison : -comparison;
      });

      setItems(sortedItems);
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    const allIds = items.map((i) => i.id);
    setSelected(new Set(allIds));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleSort(column: 'id' | 'userId') {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new column and default to ASC
      setSortBy(column);
      setOrder('ASC');
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(
        `/admin/manage-access/free-access/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    setActionLoading(true);
    setError(null);
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(
            `/admin/manage-access/free-access/${encodeURIComponent(id)}`,
            { method: 'DELETE' },
          ),
        ),
      );
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message || 'Bulk action failed');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  const allVisibleSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));

  return (
    <div className="flex w-full flex-col min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Manage permissions</h1>
      <div className="flex gap-2 mb-4">
        <Button className="w-40" onClick={() => router.push(`${pathname}/add`)}>
          Add Permission
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteSelected}
          disabled={selected.size === 0 || actionLoading}
        >
          {actionLoading ? 'Removing...' : `Remove selected (${selected.size})`}
        </Button>
        <Button
          onClick={allVisibleSelected ? clearSelection : selectAllVisible}
        >
          {allVisibleSelected ? 'Clear selection' : 'Select all'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <Table className="w-full min-w-[1200px] table-auto">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[50px] min-w-[50px]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() =>
                    allVisibleSelected ? clearSelection() : selectAllVisible()
                  }
                  aria-label="select all"
                />
              </TableHead>
              <TableHead
                className="min-w-[180px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('userId')}
              >
                <div className="flex items-center gap-1">
                  User ID
                  {sortBy === 'userId' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[250px]">Email</TableHead>
              <TableHead className="min-w-[100px]">Granted</TableHead>
              <TableHead className="min-w-[120px]">Permanent PRO</TableHead>
              <TableHead className="min-w-[180px]">Created At</TableHead>
              <TableHead
                className="min-w-[200px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  Permission ID
                  {sortBy === 'id' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 py-6"
                >
                  No permissions
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label={`select ${item.id}`}
                    />
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex items-center gap-3">
                      {/*<Avatar src={item.user.avatar ?? undefined} alt={`${item.user.firstName} ${item.user.lastName}`} />*/}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium break-words">
                          {item.user.firstName} {item.user.lastName}
                        </span>
                        <span className="text-sm text-gray-500 break-words">
                          ID: {item.user.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[250px] break-words">
                    {item.user.email}
                  </TableCell>
                  <TableCell className="min-w-[100px]">PRO</TableCell>
                  <TableCell className="min-w-[120px]">
                    {item.permanent ? '✅' : '—'}
                  </TableCell>
                  <TableCell className="min-w-[180px] whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm min-w-[200px] break-all">
                    {item.id}
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex gap-2 flex-wrap">
                      {!item.permanent && (
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(item.id)}
                        className="text-xs"
                      >
                        Copy ID
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center mt-4">{error}</div>
      )}
    </div>
  );
}
