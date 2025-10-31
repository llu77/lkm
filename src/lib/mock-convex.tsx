// Mock hooks to replace convex/react
import { useState, useEffect } from 'react';

// Mock useQuery hook
export function useQuery(query: any, args?: any) {
  return null;
}

// Mock useMutation hook
export function useMutation(mutation: any) {
  return async (args: any) => {
    console.log('Mock mutation called with:', args);
    return null;
  };
}

// Mock useConvexAuth hook
export function useConvexAuth() {
  return {
    isLoading: false,
    isAuthenticated: true,
  };
}

// Mock ConvexProvider component
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Mock ConvexReactClient
export class ConvexReactClient {
  constructor(url: string) {}
}

// Mock Authenticated component
export function Authenticated({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Mock Unauthenticated component
export function Unauthenticated({ children }: { children: React.ReactNode }) {
  return null;
}
