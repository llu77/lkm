import { useState, useEffect } from "react";

export function useBranch() {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const savedBranchId = localStorage.getItem("selectedBranchId");
    const savedBranchName = localStorage.getItem("selectedBranchName");
    
    if (savedBranchId && savedBranchName) {
      setBranchId(savedBranchId);
      setBranchName(savedBranchName);
    }
  }, []);

  const selectBranch = (newBranchId: string, newBranchName: string) => {
    setBranchId(newBranchId);
    setBranchName(newBranchName);
    localStorage.setItem("selectedBranchId", newBranchId);
    localStorage.setItem("selectedBranchName", newBranchName);
  };

  const clearBranch = () => {
    setBranchId(null);
    setBranchName(null);
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("selectedBranchName");
  };

  return {
    branchId,
    branchName,
    selectBranch,
    clearBranch,
    isSelected: branchId !== null && branchName !== null,
  };
}
