import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon, ShieldIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { useBranch } from "@/hooks/use-branch.ts";
import { BranchSelector } from "@/components/branch-selector.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const ADMIN_PASSWORD = "Omar101010#";

interface Request {
  _id: Id<"employeeRequests">;
  _creationTime: number;
  employeeName: string;
  requestType: string;
  status: string;
  requestDate: number;
  branchName: string;
  advanceAmount?: number;
  vacationDate?: number;
  duesAmount?: number;
  permissionDate?: number;
  permissionStartTime?: string;
  permissionEndTime?: string;
  permissionHours?: number;
  violationDate?: number;
  objectionReason?: string;
  objectionDetails?: string;
  nationalId?: string;
  resignationText?: string;
  adminResponse?: string;
  responseDate?: number;
}

export default function ManageRequestsPage() {
  const { branchId, branchName, isSelected, selectBranch } = useBranch();

  if (!isSelected) {
    return <BranchSelector onBranchSelected={selectBranch} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>إدارة الطلبات</CardTitle>
              <CardDescription>يرجى تسجيل الدخول أولاً</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto max-w-7xl p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <ManageRequestsContent branchId={branchId!} branchName={branchName!} />
      </Authenticated>
    </div>
  );
}

function ManageRequestsContent({ branchId, branchName }: { branchId: string; branchName: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  const requests = useQuery(api.employeeRequests.getAllRequests, { branchId });
  const updateStatus = useMutation(api.employeeRequests.updateStatus);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

  // نموذج إدخال كلمة المرور
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldIcon className="size-8 text-primary" />
            </div>
            <CardTitle>إدارة الطلبات - {branchName}</CardTitle>
            <CardDescription>
              هذه الصفحة محمية. يرجى إدخال كلمة المرور للوصول
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (password === ADMIN_PASSWORD) {
                      setIsAuthenticated(true);
                      toast.success("تم الدخول بنجاح");
                    } else {
                      toast.error("كلمة مرور خاطئة");
                      setPassword("");
                    }
                  }
                }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (password === ADMIN_PASSWORD) {
                  setIsAuthenticated(true);
                  toast.success("تم الدخول بنجاح");
                } else {
                  toast.error("كلمة مرور خاطئة");
                  setPassword("");
                }
              }}
            >
              دخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requests === undefined) {
    return (
      <div className="container mx-auto max-w-7xl p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "تحت الإجراء");
  const approved = requests.filter((r) => r.status === "مقبول");
  const rejected = requests.filter((r) => r.status === "مرفوض");

  const handleReview = (request: Request, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminResponse("");
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    const newStatus = reviewAction === "approve" ? "مقبول" : "مرفوض";
    
    try {
      await updateStatus({
        requestId: selectedRequest._id,
        status: newStatus,
        adminResponse: adminResponse || undefined,
      });

      toast.success(
        reviewAction === "approve"
          ? "تم قبول الطلب بنجاح"
          : "تم رفض الطلب"
      );
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setAdminResponse("");
    } catch (error) {
      toast.error("حدث خطأ أثناء معالجة الطلب");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "تحت الإجراء") {
      return <Badge variant="secondary"><ClockIcon className="size-3 ml-1" />تحت الإجراء</Badge>;
    }
    if (status === "مقبول") {
      return <Badge className="bg-green-600"><CheckCircleIcon className="size-3 ml-1" />مقبول</Badge>;
    }
    return <Badge variant="destructive"><XCircleIcon className="size-3 ml-1" />مرفوض</Badge>;
  };

  const getRequestDetails = (request: Request) => {
    const details: { label: string; value: string }[] = [];

    if (request.advanceAmount) {
      details.push({ label: "المبلغ", value: `${request.advanceAmount} ر.س` });
    }
    if (request.vacationDate) {
      details.push({ label: "تاريخ الإجازة", value: format(request.vacationDate, "dd/MM/yyyy", { locale: ar }) });
    }
    if (request.duesAmount) {
      details.push({ label: "المبلغ", value: `${request.duesAmount} ر.س` });
    }
    if (request.permissionDate) {
      details.push({ label: "تاريخ الاستئذان", value: format(request.permissionDate, "dd/MM/yyyy", { locale: ar }) });
      if (request.permissionStartTime) details.push({ label: "وقت الاستئذان", value: request.permissionStartTime });
      if (request.permissionEndTime) details.push({ label: "وقت العودة", value: request.permissionEndTime });
      if (request.permissionHours) details.push({ label: "عدد الساعات", value: `${request.permissionHours} ساعة` });
    }
    if (request.violationDate) {
      details.push({ label: "تاريخ المخالفة", value: format(request.violationDate, "dd/MM/yyyy", { locale: ar }) });
      if (request.objectionReason) details.push({ label: "سبب الاعتراض", value: request.objectionReason });
      if (request.objectionDetails) details.push({ label: "تفاصيل إضافية", value: request.objectionDetails });
    }
    if (request.nationalId) {
      details.push({ label: "رقم الهوية", value: request.nationalId });
    }

    return details;
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground">مراجعة وإدارة طلبات الموظفين - {branchName}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-lg py-2 px-4">
            <ClipboardListIcon className="size-4 ml-1" />
            {requests.length} طلب
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">تحت الإجراء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">مقبول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approved.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">مرفوض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{rejected.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardListIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">لا توجد طلبات</p>
            <p className="text-sm text-muted-foreground">سيتم عرض الطلبات هنا عندما يتم إنشاؤها</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {request.employeeName}
                      {getStatusBadge(request.status)}
                    </CardTitle>
                    <CardDescription>
                      {request.requestType} • {format(request.requestDate, "dd MMMM yyyy", { locale: ar })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {request.status === "تحت الإجراء" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReview(request, "approve")}
                        >
                          <CheckCircleIcon className="size-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReview(request, "reject")}
                        >
                          <XCircleIcon className="size-4 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRequestDetails(request).map((detail, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{detail.label}:</span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                ))}
                
                {request.resignationText && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="font-medium mb-2">نص الاستقالة:</div>
                    <div className="whitespace-pre-wrap">{request.resignationText}</div>
                  </div>
                )}

                {request.adminResponse && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm border border-blue-200 dark:border-blue-800">
                    <div className="font-medium mb-2 text-blue-900 dark:text-blue-100">رد الإدارة:</div>
                    <div className="text-blue-800 dark:text-blue-200">{request.adminResponse}</div>
                    {request.responseDate && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {format(request.responseDate, "dd/MM/yyyy HH:mm", { locale: ar })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "قبول الطلب" : "رفض الطلب"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && `طلب ${selectedRequest.requestType} من ${selectedRequest.employeeName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">رد الإدارة {reviewAction === "reject" ? "(مطلوب)" : "(اختياري)"}</Label>
              <Textarea
                id="response"
                placeholder="اكتب رد الإدارة هنا..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewAction === "reject" && !adminResponse.trim()}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {reviewAction === "approve" ? "قبول الطلب" : "رفض الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
