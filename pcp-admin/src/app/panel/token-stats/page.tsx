'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TokenResponse, TokenRow } from '@/types/token.types';
import { ModelData, UserModelsData } from '@/types/token-stats.types';
import { buildQuery } from '@/lib/query-build';
import { TokenStatsFilters } from '@/components/token-stats/TokenStatsFilters';
import { UserModelsAccordion } from '@/components/token-stats/UserModelsAccordion';
import { PaginationControls } from '@/components/token-stats/PaginationControls';
import { TotalsSummary } from '@/components/token-stats/TotalsSummary';
import {
  processModelData,
  recalculateModelCosts,
} from '@/lib/token-stats-utils';

export default function TokenStats() {
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [userModels, setUserModels] = useState<UserModelsData>({});
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<TokenResponse['totals'] | null>(null);

  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<
    'userId' | 'totalTokens' | 'promptTokens' | 'completionTokens' | 'createdAt'
  >('totalTokens');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [price, setPrice] = useState<number | ''>('');

  const groupBy = 'user';

  useEffect(() => {
    fetchData();
  }, [page, limit, sortBy, order]);

  // Re-sort rows when sortBy is userId and order changes
  useEffect(() => {
    if (sortBy === 'userId' && rows.length > 0) {
      const sortedRows = [...rows].sort((a, b) => {
        const aId = a.userId ? Number(a.userId) : 0;
        const bId = b.userId ? Number(b.userId) : 0;
        const comparison = aId - bId;
        return order === 'ASC' ? comparison : -comparison;
      });
      setRows(sortedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order]);

  useEffect(() => {
    // Fetch model data for all users when rows change
    if (rows.length > 0) {
      console.log(
        'Fetching models for users:',
        rows.map((r) => r.userId),
      );
      fetchAllUserModels();
    } else {
      setUserModels({});
    }
  }, [rows]);

  // Recalculate costs when price changes
  useEffect(() => {
    if (Object.keys(userModels).length > 0 && price !== '') {
      const updatedModels = recalculateModelCosts(userModels, price);
      setUserModels(updatedModels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        groupBy,
      };

      // Only send sortBy and order to server if not sorting by userId
      if (sortBy !== 'userId') {
        params.sortBy = sortBy;
        params.order = order;
      }

      if (userId) params.userId = userId;

      const qs = buildQuery(params);
      const res = await apiFetch<TokenResponse>(
        `/admin/activity/token-usage${qs}`,
      );

      if (res.data) {
        const mapped: TokenRow[] = res.data.map((r: any) => ({
          userId: r.userId ?? r.user_id ?? null,
          email: r.email ?? null,
          firstName: r.firstName ?? r.first_name ?? null,
          lastName: r.lastName ?? r.last_name ?? null,
          role: r.role ?? null,
          avatar: r.avatar ?? null,
          promptTokens: Number(r.promptTokens ?? r.prompt_tokens ?? 0),
          completionTokens: Number(
            r.completionTokens ?? r.completion_tokens ?? 0,
          ),
          totalTokens: Number(r.totalTokens ?? r.total_tokens ?? 0),
          createdAt: r.createdAt ?? r.created_at ?? null,
        }));

        // Sort by userId on client if needed
        let sortedRows = mapped;
        if (sortBy === 'userId') {
          sortedRows = [...mapped].sort((a, b) => {
            const aId = a.userId ? Number(a.userId) : 0;
            const bId = b.userId ? Number(b.userId) : 0;
            const comparison = aId - bId;
            return order === 'ASC' ? comparison : -comparison;
          });
        }

        setRows(sortedRows);
        setTotal(res.meta?.total ?? sortedRows.length);
      } else {
        setRows([]);
        setTotal(0);
      }
      setTotals(res.totals ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load token stats');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllUserModels() {
    const modelsData: Record<string, ModelData[]> = {};
    const loadingStates: Record<string, boolean> = {};

    const usersWithId = rows.filter((row) => row.userId);
    console.log('Users with ID to fetch models:', usersWithId.length);

    for (const row of usersWithId) {
      if (row.userId) {
        loadingStates[row.userId] = true;
      }
    }
    setLoadingModels(loadingStates);

    try {
      await Promise.all(
        usersWithId.map(async (row) => {
          if (!row.userId) return;

          console.log(`Fetching models for user ${row.userId}...`);

          try {
            // First try with groupBy: 'model'
            let params: Record<string, any> = {
              page: 1,
              limit: 1000,
              groupBy: 'model',
            };
            if (row.userId) params.userId = row.userId;

            let qs = buildQuery(params);
            let res = await apiFetch<TokenResponse>(
              `/admin/activity/token-usage${qs}`,
            );

            // Debug logging
            console.log(
              `Models data for user ${row.userId} (groupBy=model):`,
              res,
            );

            // Try both res.data and res.items
            let dataArray = res.data || res.items || [];

            // If no data with groupBy: 'model', try without groupBy and group on client
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
              console.log(`Trying without groupBy for user ${row.userId}...`);
              params = {
                page: 1,
                limit: 10000, // Get more records to group on client
              };
              if (row.userId) params.userId = row.userId;

              qs = buildQuery(params);
              res = await apiFetch<TokenResponse>(
                `/admin/activity/token-usage${qs}`,
              );

              console.log(`Raw data for user ${row.userId}:`, res);
              dataArray = res.data || res.items || [];

              // Group by model on client side
              if (Array.isArray(dataArray) && dataArray.length > 0) {
                const models = processModelData(dataArray, price);
                console.log(
                  `Client-grouped models for user ${row.userId}:`,
                  models,
                );
                if (models.length > 0) {
                  modelsData[row.userId] = models;
                }
                return; // Exit early since we processed client-side grouping
              }
            }

            // Process server-grouped data
            if (Array.isArray(dataArray) && dataArray.length > 0) {
              const models = processModelData(dataArray, price);
              console.log(`Processed models for user ${row.userId}:`, models);
              if (models.length > 0) {
                modelsData[row.userId] = models;
              }
            } else {
              console.log(
                `No data or invalid format for user ${row.userId}:`,
                res,
              );
            }
          } catch (err) {
            console.error(
              `Failed to fetch models for user ${row.userId}:`,
              err,
            );
          }
        }),
      );

      setUserModels(modelsData);
    } finally {
      setLoadingModels({});
    }
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setPage(1);
    fetchData();
  }

  function resetFilters() {
    setUserId('');
    setSelectedModel('all');
    setPage(1);
    setLimit(50);
    setSortBy('totalTokens');
    setOrder('DESC');
    setPrice('');
    fetchData();
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  function handleSort(column: typeof sortBy) {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new column and default to DESC
      setSortBy(column);
      setOrder('DESC');
    }
    setPage(1); // Reset to first page when sorting changes
  }

  if (loading)
    return (
      <div className="flex w-full items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="flex w-full flex-col min-h-screen bg-gray-50 p-6">
      <TokenStatsFilters
        userId={userId}
        selectedModel={selectedModel}
        price={price}
        onUserIdChange={setUserId}
        onSelectedModelChange={setSelectedModel}
        onPriceChange={setPrice}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <Table className="w-full table-auto">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead
                className="w-[120px] cursor-pointer hover:bg-gray-200 select-none"
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
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead
                className="w-[120px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('promptTokens')}
              >
                <div className="flex items-center gap-1">
                  Prompt Tokens
                  {sortBy === 'promptTokens' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[140px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('completionTokens')}
              >
                <div className="flex items-center gap-1">
                  Completion Tokens
                  {sortBy === 'completionTokens' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleSort('totalTokens')}
              >
                <div className="flex items-center gap-1">
                  Total Tokens
                  {sortBy === 'totalTokens' && (
                    <span className="text-xs">
                      {order === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] max-w-[100px]">
                Models
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-6"
                >
                  No records
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => {
                const userModelsData = r.userId
                  ? userModels[r.userId] || []
                  : [];
                const isLoading = r.userId ? loadingModels[r.userId] : false;
                const hasModels = userModelsData.length > 0;

                return (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {r?.userId ?? '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r?.email ?? '-'}
                    </TableCell>
                    <TableCell>
                      {(r.promptTokens ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {(r.completionTokens ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {(r.totalTokens ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="min-w-[200px] max-w-[240px]">
                      <UserModelsAccordion
                        userId={r.userId ?? null}
                        userIndex={idx}
                        models={userModelsData}
                        selectedModel={selectedModel}
                        price={price}
                        isLoading={isLoading}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
        total={total}
        rowsCount={rows.length}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {totals && <TotalsSummary totals={totals} />}

      {error && (
        <div className="text-red-500 text-sm text-center mt-4">{error}</div>
      )}
    </div>
  );
}
