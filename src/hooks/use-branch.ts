// Mock branch hook
import { useState } from 'react';

export function useBranch() {
  const [branchId] = useState<string>('default-branch');
  const [branchName] = useState<string>('Main Branch');

  return {
    branchId,
    branchName,
    setBranchId: () => {},
  };
}
