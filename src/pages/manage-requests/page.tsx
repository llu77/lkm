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
import { useState, useEffect } from "react";
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

  useEffect(() => {
    console.log("🔐 Manage Requests Page Loaded", { isSelected, isAuthenticated, branchId, branchName });
  }, [isSelected, isAuthenticated, branchId, branchName]);

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

  useEffect(() => {
    console.log("📋 Requests Data:", { branchId, branchName, requests, count: requests?.length });
  }, [branchId, branchName, requests]);

  if (requests === undefined) {
    return (
      <div className="container mx-auto max-w-7xl p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "تحت الإجراء");
  const approvedRequests = requests.filter((r) => r.status === "مقبول");
  const rejectedRequests = requests.filter((r) => r.status === "مرفوض");

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    try {
      const status = action === "approve" ? "مقبول" : "مرفوض";
      await updateStatus({
        requestId: selectedRequest._id,
        status,
        adminResponse: adminResponse.trim() || undefined,
      });

      toast.success(`تم ${status === "مقبول" ? "قبول" : "رفض"} الطلب بنجاح`);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setAdminResponse("");
    } catch (error) {
      toast.error("فشل في تحديث الطلب");
    }
  };

  const renderRequestDetails = (request: Request) => {
    switch (request.requestType) {
      case "سلفة":
        return (
          <div className="space-y-2">
            <p><strong>المبلغ:</strong> {request.advanceAmount?.toLocaleString()} ر.س</p>
          </div>
        );
      case "إجازة":
        return (
          <div className="space-y-2">
            <p><strong>تاريخ الإجازة:</strong> {request.vacationDate ? format(request.vacationDate, "dd/MM/yyyy", { locale: ar }) : "-"}</p>
          </div>
        );
      case "صرف متأخرات":
        return (
          <div className="space-y-2">
            <p><strong>المبلغ المطلوب:</strong> {request.duesAmount?.toLocaleString()} ر.س</p>
          </div>
        );
      case "استئذان":
        return (
          <div className="space-y-2">
            <p><strong>تاريخ الاستئذان:</strong> {request.permissionDate ? format(request.permissionDate, "dd/MM/yyyy", { locale: ar }) : "-"}</p>
            <p><strong>من الساعة:</strong> {request.permissionStartTime}</p>
            <p><strong>إلى الساعة:</strong> {request.permissionEndTime}</p>
            <p><strong>عدد الساعات:</strong> {request.permissionHours} ساعة</p>
          </div>
        );
      case "اعتراض على مخالفة":
        return (
          <div className="space-y-2">
            <p><strong>تاريخ المخالفة:</strong> {request.violationDate ? format(request.violationDate, "dd/MM/yyyy", { locale: ar }) : "-"}</p>
            <p><strong>سبب الاعتراض:</strong> {request.objectionReason}</p>
            {request.objectionDetails && (
              <p><strong>التفاصيل:</strong> {request.objectionDetails}</p>
            )}
          </div>
        );
      case "استقالة":
        return (
          <div className="space-y-2">
            <p><strong>رقم الهوية:</strong> {request.nationalId}</p>
            <div className="mt-2 rounded-md bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm">{request.resignationText}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground">{branchName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <ClipboardListIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحت الإجراء</CardTitle>
            <ClockIcon className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مقبول</CardTitle>
            <CheckCircleIcon className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مرفوض</CardTitle>
            <XCircleIcon className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات</CardTitle>
          <CardDescription>قائمة بجميع طلبات الموظفين</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{request.employeeName}</h3>
                      <Badge variant="outline">{request.requestType}</Badge>
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
                      تاريخ الطلب: {format(request.requestDate, "dd MMMM yyyy - hh:mm a", { locale: ar })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowReviewDialog(true);
                        setReviewAction("approve");
                        setAdminResponse(request.adminResponse || "");
                      }}
                    >
                      <EyeIcon className="size-4 ml-2" />
                      عرض
                    </Button>
                    {request.status === "تحت الإجراء" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewAction("approve");
                            setAdminResponse("");
                            setShowReviewDialog(true);
                          }}
                        >
                          <CheckCircleIcon className="size-4 ml-2" />
                          قبول
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewAction("reject");
                            setAdminResponse("");
                            setShowReviewDialog(true);
                          }}
                        >
                          <XCircleIcon className="size-4 ml-2" />
                          رفض
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="review-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "قبول الطلب" : "رفض الطلب"}
            </DialogTitle>
            <DialogDescription id="review-dialog-description">
              مراجعة تفاصيل الطلب وإضافة رد الإدارة
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>الموظف</Label>
                <p className="text-sm">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <Label>نوع الطلب</Label>
                <p className="text-sm">{selectedRequest.requestType}</p>
              </div>
              <div>
                <Label>التفاصيل</Label>
                {renderRequestDetails(selectedRequest)}
              </div>
              {selectedRequest.status !== "تحت الإجراء" && selectedRequest.adminResponse && (
                <div>
                  <Label>رد الإدارة السابق</Label>
                  <p className="text-sm rounded-md bg-muted p-3">{selectedRequest.adminResponse}</p>
                </div>
              )}
              {selectedRequest.status === "تحت الإجراء" && (
                <div className="space-y-2">
                  <Label htmlFor="adminResponse">رد الإدارة (اختياري)</Label>
                  <Textarea
                    id="adminResponse"
                    placeholder="أضف رد الإدارة هنا..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              إلغاء
            </Button>
            {selectedRequest?.status === "تحت الإجراء" && (
              <Button
                variant={reviewAction === "approve" ? "default" : "destructive"}
                onClick={() => handleReview(reviewAction)}
              >
                {reviewAction === "approve" ? "قبول" : "رفض"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}