import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useBranch } from "@/hooks/use-branch.ts";
import { BranchSelector } from "@/components/branch-selector.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { CalendarIcon, ClipboardListIcon } from "lucide-react";

const BRANCH_EMPLOYEES = {
  "1010": ["عبدالحي جلال", "محمود عمارة", "علاء ناصر", "السيد محمد", "عمرو"],
  "2020": ["محمد إسماعيل", "محمد ناصر", "فارس محمد"],
};

const BRANCH_SUPERVISORS = {
  "1010": "عبدالحي جلال",
  "2020": "محمد إسماعيل",
};

const OBJECTION_REASONS = [
  "لم أقم بعمل المخالفة إطلاقاً",
  "كان هناك سبب اضطراري",
  "طلب مراجعة الكاميرا",
  "المشرف قام بتبليغ التفاصيل بشكل غير دقيق",
  "هذه المرة الأولى للمخالفة",
  "المشرف لم يخبرني عن التعليمات من قبل",
  "أنا أتحمل جزء من المخالفة فقط",
];

export default function EmployeeRequestsPage() {
  const { branchId, branchName } = useBranch();

  if (!branchId || !branchName) {
    return <BranchSelector />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>تسجيل الدخول مطلوب</CardTitle>
              <CardDescription>
                يجب تسجيل الدخول لإنشاء طلبات الموظفين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <EmployeeRequestsForm branchId={branchId} branchName={branchName} />
      </Authenticated>
    </div>
  );
}

function EmployeeRequestsForm({ branchId, branchName }: { branchId: string; branchName: string }) {
  const createRequest = useMutation(api.employeeRequests.create);
  
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [requestType, setRequestType] = useState("");
  const [date, setDate] = useState("");
  
  // طلب سلفة
  const [advanceAmount, setAdvanceAmount] = useState("");
  
  // طلب صرف متأخرات
  const [duesAmount, setDuesAmount] = useState("");
  
  // طلب استئذان
  const [permissionStartTime, setPermissionStartTime] = useState("");
  const [permissionEndTime, setPermissionEndTime] = useState("");
  
  // طلب اعتراض على مخالفة
  const [objectionReason, setObjectionReason] = useState("");
  const [objectionDetails, setObjectionDetails] = useState("");
  
  // طلب استقالة
  const [nationalId, setNationalId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employees = BRANCH_EMPLOYEES[branchId as keyof typeof BRANCH_EMPLOYEES] || [];
  const supervisor = BRANCH_SUPERVISORS[branchId as keyof typeof BRANCH_SUPERVISORS] || "";

  const calculatePermissionHours = () => {
    if (!permissionStartTime || !permissionEndTime) return 0;
    
    const [startHour, startMin] = permissionStartTime.split(":").map(Number);
    const [endHour, endMin] = permissionEndTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const diffMinutes = endMinutes - startMinutes;
    return diffMinutes / 60;
  };

  const generateResignationText = () => {
    return `السلام عليكم ورحمة الله وبركاته،

أنا الموظف ${selectedEmployee}

أتقدم بطلب استقالة من ${branchName} وعدم رغبتي رقم الهوية ${nationalId || "____________"} في استكمال المدة المتبقية من العقد، وذلك لأسباب شخصية تعود لي.

ولذلك أرجوا قبول استقالتي وشكراً.

التوقيع: ________________
التاريخ: ${new Date().toLocaleDateString("ar-SA")}

الجهة الأخرى:
${branchName}
المشرف: ${supervisor}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !requestType) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (requestType === "استقالة" && (!nationalId || nationalId.length !== 10)) {
      toast.error("يرجى إدخال رقم هوية صحيح (10 أرقام)");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: Record<string, string | number | undefined> = {
        branchId,
        branchName,
        employeeName: selectedEmployee,
        requestType,
      };

      if (requestType === "سلفة" && advanceAmount) {
        requestData.advanceAmount = parseFloat(advanceAmount);
      }

      if (requestType === "إجازة" && date) {
        requestData.vacationDate = new Date(date).getTime();
      }

      if (requestType === "صرف متأخرات" && duesAmount) {
        requestData.duesAmount = parseFloat(duesAmount);
      }

      if (requestType === "استئذان") {
        if (date && permissionStartTime && permissionEndTime) {
          requestData.permissionDate = new Date(date).getTime();
          requestData.permissionStartTime = permissionStartTime;
          requestData.permissionEndTime = permissionEndTime;
          requestData.permissionHours = calculatePermissionHours();
        }
      }

      if (requestType === "اعتراض على مخالفة") {
        if (date) {
          requestData.violationDate = new Date(date).getTime();
        }
        if (objectionReason) {
          requestData.objectionReason = objectionReason;
        }
        if (objectionDetails) {
          requestData.objectionDetails = objectionDetails;
        }
      }

      if (requestType === "استقالة") {
        requestData.nationalId = nationalId;
        requestData.resignationText = generateResignationText();
      }

      await createRequest(requestData);

      toast.success("تم إرسال الطلب بنجاح");

      // Reset form
      setSelectedEmployee("");
      setRequestType("");
      setDate("");
      setAdvanceAmount("");
      setDuesAmount("");
      setPermissionStartTime("");
      setPermissionEndTime("");
      setObjectionReason("");
      setObjectionDetails("");
      setNationalId("");
    } catch (error) {
      toast.error("فشل إرسال الطلب");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClipboardListIcon className="size-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">طلبات الموظفين</CardTitle>
              <CardDescription>إنشاء طلب جديد - {branchName}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اسم الموظف */}
            <div className="space-y-2">
              <Label htmlFor="employee">اسم الموظف *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر اسم الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* نوع الطلب */}
            <div className="space-y-2">
              <Label htmlFor="requestType">نوع الطلب *</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="سلفة">طلب سلفة</SelectItem>
                  <SelectItem value="إجازة">طلب إجازة</SelectItem>
                  <SelectItem value="صرف متأخرات">طلب صرف متأخرات</SelectItem>
                  <SelectItem value="استئذان">طلب استئذان</SelectItem>
                  <SelectItem value="اعتراض على مخالفة">طلب اعتراض على مخالفة</SelectItem>
                  <SelectItem value="استقالة">طلب استقالة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* حقول خاصة بطلب السلفة */}
            {requestType === "سلفة" && (
              <div className="space-y-2">
                <Label htmlFor="advanceAmount">قيمة السلفة (ريال) *</Label>
                <Input
                  id="advanceAmount"
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {/* حقول خاصة بطلب الإجازة */}
            {requestType === "إجازة" && (
              <div className="space-y-2">
                <Label htmlFor="vacationDate">تاريخ الإجازة *</Label>
                <Input
                  id="vacationDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            )}

            {/* حقول خاصة بطلب صرف المتأخرات */}
            {requestType === "صرف متأخرات" && (
              <div className="space-y-2">
                <Label htmlFor="duesAmount">المبلغ المطلوب صرفه (ريال) *</Label>
                <Input
                  id="duesAmount"
                  type="number"
                  value={duesAmount}
                  onChange={(e) => setDuesAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {/* حقول خاصة بطلب الاستئذان */}
            {requestType === "استئذان" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="permissionDate">التاريخ *</Label>
                  <Input
                    id="permissionDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">وقت الاستئذان *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={permissionStartTime}
                      onChange={(e) => setPermissionStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">وقت العودة المتوقع *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={permissionEndTime}
                      onChange={(e) => setPermissionEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {permissionStartTime && permissionEndTime && (
                  <div className="text-sm text-muted-foreground">
                    ساعات الاستئذان: {calculatePermissionHours().toFixed(2)} ساعة
                  </div>
                )}
              </div>
            )}

            {/* حقول خاصة بطلب الاعتراض على مخالفة */}
            {requestType === "اعتراض على مخالفة" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="violationDate">تاريخ المخالفة *</Label>
                  <Input
                    id="violationDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectionReason">سبب الاعتراض *</Label>
                  <Select value={objectionReason} onValueChange={setObjectionReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر سبب الاعتراض" />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECTION_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {objectionReason === "كان هناك سبب اضطراري" && (
                  <div className="space-y-2">
                    <Label htmlFor="objectionDetails">تفاصيل السبب الاضطراري *</Label>
                    <Textarea
                      id="objectionDetails"
                      value={objectionDetails}
                      onChange={(e) => setObjectionDetails(e.target.value)}
                      placeholder="اكتب تفاصيل السبب..."
                      rows={4}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* حقول خاصة بطلب الاستقالة */}
            {requestType === "استقالة" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">رقم الهوية * (10 أرقام)</Label>
                  <Input
                    id="nationalId"
                    type="text"
                    value={nationalId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNationalId(value);
                    }}
                    placeholder="1234567890"
                    maxLength={10}
                    required
                  />
                </div>
                {nationalId.length === 10 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="mb-2 block">معاينة طلب الاستقالة:</Label>
                    <pre className="whitespace-pre-wrap text-sm">{generateResignationText()}</pre>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
