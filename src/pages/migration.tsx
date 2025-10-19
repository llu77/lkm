import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";

export default function Migration() {
  const deleteAllUsers = useMutation(api.migration.deleteAllUsers);

  const handleDelete = async () => {
    try {
      const result = await deleteAllUsers();
      toast.success(`تم حذف ${result.deleted} مستخدم`);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>حذف البيانات القديمة</CardTitle>
          <CardDescription>
            انقر على الزر أدناه لحذف جميع بيانات Instagram القديمة وبدء نظام الإدارة المالية بقاعدة بيانات نظيفة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDelete} variant="destructive" className="w-full">
            حذف جميع البيانات القديمة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
