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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  if (!isSelected) {
    return <BranchSelector onBranchSelected={selectBranch} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldIcon className="size-8 text-primary" />
            </div>
            <CardTitle>إدارة الطلبات</CardTitle>
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
  const requests = useQuery(api.employeeRequests.getAllRequests, { branchId });
  const updateStatus = useMutation(api.employeeRequests.updateStatus);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

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
        ...(adminResponse.trim() ? { adminResponse: adminResponse.trim() } : {}),
      });
      toast.success(`تم ${reviewAction === "approve" ? "قبول" : "رفض"} الطلب بنجاح`);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setAdminResponse("");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الطلب");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground">مراجعة وإدارة طلبات الموظفين</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ClockIcon className="size-4 text-yellow-500" />
              تحت الإجراء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircleIcon className="size-4 text-green-500" />
              مقبول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <XCircleIcon className="size-4 text-red-500" />
              مرفوض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejected.length}</div>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الطلبات قيد المراجعة</CardTitle>
            <CardDescription>طلبات تحتاج إلى موافقة أو رفض</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pending.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.employeeName}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{request.requestType}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.requestDate), "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <EyeIcon className="size-4 ml-2" />
                      عرض
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReview(request, "approve")}
                    >
                      <CheckCircleIcon className="size-4 ml-2" />
                      قبول
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReview(request, "reject")}
                    >
                      <XCircleIcon className="size-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardListIcon className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.employeeName}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{request.requestType}</span>
                      <Badge
                        variant={
                          request.status === "مقبول"
                            ? "default"
                            : request.status === "مرفوض"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.requestDate), "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <EyeIcon className="size-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest && !showReviewDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">اسم الموظف:</span>
                  <span>{selectedRequest.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">نوع الطلب:</span>
                  <span>{selectedRequest.requestType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الحالة:</span>
                  <Badge
                    variant={
                      selectedRequest.status === "مقبول"
                        ? "default"
                        : selectedRequest.status === "مرفوض"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">تاريخ الطلب:</span>
                  <span>{format(new Date(selectedRequest.requestDate), "dd MMMM yyyy", { locale: ar })}</span>
                </div>

                {selectedRequest.requestType === "سلفة" && selectedRequest.advanceAmount && (
                  <div className="flex justify-between">
                    <span className="font-medium">المبلغ:</span>
                    <span>{selectedRequest.advanceAmount.toLocaleString()} ر.س</span>
                  </div>
                )}

                {selectedRequest.requestType === "إجازة" && selectedRequest.vacationDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">تاريخ الإجازة:</span>
                    <span>{format(new Date(selectedRequest.vacationDate), "dd MMMM yyyy", { locale: ar })}</span>
                  </div>
                )}

                {selectedRequest.requestType === "صرف متأخرات" && selectedRequest.duesAmount && (
                  <div className="flex justify-between">
                    <span className="font-medium">المبلغ:</span>
                    <span>{selectedRequest.duesAmount.toLocaleString()} ر.س</span>
                  </div>
                )}

                {selectedRequest.requestType === "استئذان" && (
                  <>
                    {selectedRequest.permissionDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">تاريخ الاستئذان:</span>
                        <span>{format(new Date(selectedRequest.permissionDate), "dd MMMM yyyy", { locale: ar })}</span>
                      </div>
                    )}
                    {selectedRequest.permissionStartTime && (
                      <div className="flex justify-between">
                        <span className="font-medium">وقت الاستئذان:</span>
                        <span>{selectedRequest.permissionStartTime}</span>
                      </div>
                    )}
                    {selectedRequest.permissionEndTime && (
                      <div className="flex justify-between">
                        <span className="font-medium">وقت العودة المتوقع:</span>
                        <span>{selectedRequest.permissionEndTime}</span>
                      </div>
                    )}
                    {selectedRequest.permissionHours && (
                      <div className="flex justify-between">
                        <span className="font-medium">عدد ساعات الاستئذان:</span>
                        <span>{selectedRequest.permissionHours} ساعة</span>
                      </div>
                    )}
                  </>
                )}

                {selectedRequest.requestType === "اعتراض على مخالفة" && (
                  <>
                    {selectedRequest.violationDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">تاريخ المخالفة:</span>
                        <span>{format(new Date(selectedRequest.violationDate), "dd MMMM yyyy", { locale: ar })}</span>
                      </div>
                    )}
                    {selectedRequest.objectionReason && (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">سبب الاعتراض:</span>
                        <span className="text-sm">{selectedRequest.objectionReason}</span>
                      </div>
                    )}
                    {selectedRequest.objectionDetails && (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">تفاصيل إضافية:</span>
                        <span className="text-sm">{selectedRequest.objectionDetails}</span>
                      </div>
                    )}
                  </>
                )}

                {selectedRequest.requestType === "استقالة" && selectedRequest.resignationText && (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">نص الاستقالة:</span>
                    <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                      {selectedRequest.resignationText}
                    </div>
                  </div>
                )}

                {selectedRequest.adminResponse && (
                  <>
                    <hr className="my-2" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">رد الإدارة:</span>
                      <div className="rounded-lg bg-muted p-4 text-sm">
                        {selectedRequest.adminResponse}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "قبول الطلب" : "رفض الطلب"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "يمكنك إضافة ملاحظات للموظف"
                : "يرجى تقديم سبب الرفض"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">
                {reviewAction === "approve" ? "ملاحظات (اختياري)" : "سبب الرفض"}
              </Label>
              <Textarea
                id="response"
                placeholder={
                  reviewAction === "approve"
                    ? "أضف ملاحظات إذا لزم الأمر..."
                    : "اشرح سبب رفض الطلب..."
                }
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
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleSubmitReview}
            >
              {reviewAction === "approve" ? "قبول" : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
