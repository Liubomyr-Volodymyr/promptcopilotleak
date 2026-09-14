'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, UsersResponse } from '@/types/users.types';
import { buildQuery } from '@/lib/query-build';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useDeleteUserMutation, useDeleteUsersMutation } from '@/store/api/users.api';

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'id' | 'createdAt'>('id');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [deleteUser] = useDeleteUserMutation();
  const [deleteUsers] = useDeleteUsersMutation();

  const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  // Re-sort users when sortBy or order changes
  useEffect(() => {
    if (users.length > 0) {
      const sortedUsers = [...users].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'id') {
          comparison = a.id - b.id;
        } else if (sortBy === 'createdAt') {
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return order === 'ASC' ? comparison : -comparison;
      });
      setUsers(sortedUsers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      if (isVerified === 'true') params.isVerified = true;
      if (isVerified === 'false') params.isVerified = false;

      const qs = buildQuery(params);
      const res = await apiFetch<UsersResponse>(`/admin/users${qs}`);
      let usersArray = res.items || [];

      // If search is a number, also filter by ID on client side
      if (search) {
        const searchLower = search.toLowerCase().trim();
        const searchAsNumber = Number(search);
        const isNumericSearch = !isNaN(searchAsNumber) && search.trim() !== '';

        usersArray = usersArray.filter((u) => {
          // Check if search matches name or email (server-side search)
          const matchesNameOrEmail =
            u.email?.toLowerCase().includes(searchLower) ||
            u.firstName?.toLowerCase().includes(searchLower) ||
            u.lastName?.toLowerCase().includes(searchLower) ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchLower);

          // Check if search matches ID
          const matchesId = isNumericSearch && u.id === searchAsNumber;

          return matchesNameOrEmail || matchesId;
        });
      }

      // Sort users based on sortBy and order
      const sortedUsers = [...usersArray].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'id') {
          comparison = a.id - b.id;
        } else if (sortBy === 'createdAt') {
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return order === 'ASC' ? comparison : -comparison;
      });

      setUsers(sortedUsers);
      // Update total to reflect filtered results if searching
      setTotal(search ? sortedUsers.length : res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function handleApply(e?: React.FormEvent) {
    e?.preventDefault();
    setPage(1);
    fetchData();
  }

  function handleSort(column: 'id' | 'createdAt') {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new column and default to ASC
      setSortBy(column);
      setOrder('ASC');
    }
    setPage(1); // Reset to first page when sorting changes
  }

  function toggleSelect(userId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function selectAllVisible() {
    const allIds = users.map((u) => u.id);
    setSelected(new Set(allIds));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleDeleteSingle(userId: number) {
    setUserToDelete(userId);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteSingle() {
    if (!userToDelete) return;
    
    setActionLoading(true);
    setError(null);
    try {
      await deleteUser(userToDelete).unwrap();
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(userToDelete);
        return next;
      });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      
      if (users.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
        fetchData();
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    setDeleteConfirmOpen(true);
    setUserToDelete(null); 
  }

  async function confirmDeleteBulk() {
    if (selected.size === 0) return;
    
    setActionLoading(true);
    setError(null);
    const userIds = Array.from(selected);
    const deletedCount = userIds.length;
    try {
      await deleteUsers(userIds).unwrap();
      setUsers((prev) => prev.filter((u) => !selected.has(u.id)));
      setTotal((prev) => Math.max(0, prev - deletedCount));
      setSelected(new Set());
      setDeleteConfirmOpen(false);
      
      if (users.length <= deletedCount && page > 1) {
        setPage((p) => Math.max(1, p - 1));
        fetchData();
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to delete users');
    } finally {
      setActionLoading(false);
    }
  }

  function handleConfirmDelete() {
    if (userToDelete === null) {
      confirmDeleteBulk();
    } else {
      confirmDeleteSingle();
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  const allVisibleSelected =
    users.length > 0 && users.every((u) => selected.has(u.id));

  return (
    <div className="flex w-full flex-col min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      
      <div className="flex gap-2 mb-4">
        <Button
          variant="destructive"
          onClick={handleDeleteSelected}
          disabled={selected.size === 0 || actionLoading}
        >
          {actionLoading ? 'Deleting...' : `Delete selected (${selected.size})`}
        </Button>
        <Button
          onClick={allVisibleSelected ? clearSelection : selectAllVisible}
          variant="outline"
        >
          {allVisibleSelected ? 'Clear selection' : 'Select all'}
        </Button>
      </div>
      
      <form
        onSubmit={handleApply}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg shadow-sm border mb-4"
      >
        <Input
          placeholder="Search by name, email, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={isVerified}
          onChange={(e) => setIsVerified(e.target.value)}
          className="p-2 border rounded bg-white text-gray-700"
        >
          <option value="">Any verified</option>
          <option value="true">Verified</option>
          <option value="false">Not verified</option>
        </select>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('');
              setRole('');
              setIsVerified('');
              setSortBy('id');
              setOrder('ASC');
              setPage(1);
              fetchData();
            }}
          >
            Reset
          </Button>
          <Button type="submit">Apply</Button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <Table className="w-full min-w-[800px] table-auto">
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
                className="min-w-[60px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID
                  {sortBy === 'id' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[150px]">Subscription</TableHead>
              <TableHead className="min-w-[150px]">Granted</TableHead>
              <TableHead className="min-w-[80px]">Verified</TableHead>
              <TableHead
                className="min-w-[160px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Created At
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 py-6"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      aria-label={`select user ${u.id}`}
                    />
                  </TableCell>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.subscription ? (
                      <Button variant="outline" onClick={() => openModal(u)}>
                        Details
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{u.hasFreeAccess ? 'PRO' : '-'}</TableCell>
                  <TableCell>{u.isVerified ? '✅' : '-'}</TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSingle(u.id)}
                      disabled={actionLoading}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {users.length === 0 ? 0 : (page - 1) * limit + 1} -{' '}
          {(page - 1) * limit + users.length} of {total}
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="p-2 border rounded bg-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="px-3 py-2 border rounded bg-white">{page}</div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={selectedUser}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToDelete === null
                ? `Delete ${selected.size} user${selected.size > 1 ? 's' : ''}?`
                : 'Delete user?'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {userToDelete === null
                ? `Are you sure you want to permanently delete ${selected.size} user${selected.size > 1 ? 's' : ''}? This action cannot be undone.`
                : 'Are you sure you want to permanently delete this user? This action cannot be undone.'}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setUserToDelete(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && <div className="text-red-500 text-sm text-center mt-4">{error}</div>}
    </div>
  );
}
