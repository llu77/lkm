import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { BuildingIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";

const BRANCHES = {
  "1010": "فرع لبن",
  "2020": "فرع طويق",
};

interface BranchSelectorProps {
  onBranchSelected: (branchId: string, branchName: string) => void;
}

export function BranchSelector({ onBranchSelected }: BranchSelectorProps) {
  const [branchId, setBranchId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const branchName = BRANCHES[branchId as keyof typeof BRANCHES];
    
    if (!branchName) {
      toast.error("معرف الفرع غير صحيح");
      return;
    }

    // حفظ معرف الفرع في localStorage
    localStorage.setItem("selectedBranchId", branchId);
    localStorage.setItem("selectedBranchName", branchName);
    
    toast.success(`تم الدخول إلى ${branchName}`);
    onBranchSelected(branchId, branchName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <BuildingIcon className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">اختيار الفرع</CardTitle>
          <CardDescription className="text-base">
            الرجاء إدخال معرف الفرع للمتابعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="branchId">معرف الفرع</Label>
              <Input
                id="branchId"
                type="text"
                placeholder="أدخل معرف الفرع"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                autoFocus
                className="text-center text-lg"
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <p className="font-semibold text-muted-foreground">الفروع المتاحة:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 text-green-600" />
                  <span className="font-medium">فرع لبن</span>
                  <span className="text-muted-foreground">- المعرف: 1010</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 text-green-600" />
                  <span className="font-medium">فرع طويق</span>
                  <span className="text-muted-foreground">- المعرف: 2020</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
