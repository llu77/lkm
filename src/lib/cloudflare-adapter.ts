/**
 * Cloudflare Adapter - محول للانتقال من Convex إلى Cloudflare Workers
 *
 * يوفر نفس واجهة Convex (useQuery, useMutation) لكن يتصل بـ Cloudflare Workers API
 * هذا يسمح للـ Frontend بالعمل بدون تغيير!
 */

import { useState, useEffect, useCallback } from 'react';

// تكوين API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// ===================================
// Types
// ===================================

interface ConvexEndpoint {
  _name: string; // مثال: "revenues.list"
}

type QueryArgs = Record<string, any>;

interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
}

// ===================================
// Helper: تحويل Convex endpoint إلى REST URL
// ===================================

function convertToRestUrl(endpoint: ConvexEndpoint, args?: QueryArgs): string {
  // تحويل: "revenues.list" → "/api/revenues/list"
  const path = endpoint._name.replace(/\./g, '/');

  // إضافة query parameters
  if (args && Object.keys(args).length > 0) {
    const params = new URLSearchParams();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    return `${API_BASE_URL}/api/${path}?${params.toString()}`;
  }

  return `${API_BASE_URL}/api/${path}`;
}

// ===================================
// useQuery - محاكاة Convex useQuery
// ===================================

export function useQuery<T = any>(
  endpoint: ConvexEndpoint | null,
  args?: QueryArgs
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!endpoint) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const url = convertToRestUrl(endpoint, args);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!cancelled) {
          if (result.success) {
            setData(result.data);
          } else {
            throw new Error(result.error || 'Unknown error');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setData(undefined);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [endpoint?._name, JSON.stringify(args)]);

  // إذا كان loading، نرجع undefined (كما Convex)
  if (isLoading) {
    return undefined;
  }

  // إذا كان فيه خطأ، نرجع undefined (يمكن تعديله حسب الحاجة)
  if (error) {
    console.error('Query error:', error);
    return undefined;
  }

  return data;
}

// ===================================
// useMutation - محاكاة Convex useMutation
// ===================================

export function useMutation<TArgs = any, TResult = any>(
  endpoint: ConvexEndpoint
): (args: TArgs) => Promise<TResult> {
  return useCallback(
    async (args: TArgs): Promise<TResult> => {
      try {
        // تحديد HTTP method و URL
        let method = 'POST';
        let url = convertToRestUrl(endpoint);

        // معالجة update/delete operations
        const actionName = endpoint._name.split('.').pop();

        if (actionName === 'update' || actionName === 'delete') {
          const argsObj = args as any;

          if (actionName === 'update' && argsObj.id) {
            method = 'PUT';
            url = `${convertToRestUrl(endpoint)}/${argsObj.id}`;
          } else if (actionName === 'delete' && argsObj.id) {
            method = 'DELETE';
            url = `${convertToRestUrl(endpoint)}/${argsObj.id}`;
          }
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: method !== 'DELETE' ? JSON.stringify(args) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Mutation failed');
        }

        return result.data as TResult;
      } catch (err) {
        console.error('Mutation error:', err);
        throw err;
      }
    },
    [endpoint._name]
  );
}

// ===================================
// API Endpoints - محاكاة api._generated
// ===================================

export const api = {
  revenues: {
    list: { _name: 'revenues.list' } as ConvexEndpoint,
    stats: { _name: 'revenues.stats' } as ConvexEndpoint,
    create: { _name: 'revenues.create' } as ConvexEndpoint,
    update: { _name: 'revenues.update' } as ConvexEndpoint,
    delete: { _name: 'revenues.delete' } as ConvexEndpoint,
  },
  expenses: {
    list: { _name: 'expenses.list' } as ConvexEndpoint,
    create: { _name: 'expenses.create' } as ConvexEndpoint,
    update: { _name: 'expenses.update' } as ConvexEndpoint,
    delete: { _name: 'expenses.delete' } as ConvexEndpoint,
  },
  employees: {
    list: { _name: 'employees.list' } as ConvexEndpoint,
    active: { _name: 'employees.active' } as ConvexEndpoint,
    get: { _name: 'employees.get' } as ConvexEndpoint,
    add: { _name: 'employees.add' } as ConvexEndpoint,
    update: { _name: 'employees.update' } as ConvexEndpoint,
    delete: { _name: 'employees.delete' } as ConvexEndpoint,
  },
  branches: {
    list: { _name: 'branches.list' } as ConvexEndpoint,
    get: { _name: 'branches.get' } as ConvexEndpoint,
  },
  advances: {
    list: { _name: 'advances.list' } as ConvexEndpoint,
    create: { _name: 'advances.create' } as ConvexEndpoint,
    delete: { _name: 'advances.delete' } as ConvexEndpoint,
  },
  deductions: {
    list: { _name: 'deductions.list' } as ConvexEndpoint,
    create: { _name: 'deductions.create' } as ConvexEndpoint,
    delete: { _name: 'deductions.delete' } as ConvexEndpoint,
  },
} as const;

// ===================================
// Authenticated/Unauthenticated - Dummy components
// ===================================

export function Authenticated({ children }: { children: React.ReactNode }) {
  // بدون مصادقة، نعرض المحتوى مباشرة
  return <>{children}</>;
}

export function Unauthenticated({ children }: { children: React.ReactNode }) {
  // بدون مصادقة، لا نعرض شيء
  return null;
}

export function AuthLoading({ children }: { children: React.ReactNode }) {
  // لا loading state
  return null;
}
