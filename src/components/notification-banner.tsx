import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
  SparklesIcon,
  BrainIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface NotificationBannerProps {
  branchId: string;
}

export function NotificationBanner({ branchId }: NotificationBannerProps) {
  const notifications = useQuery(api.notifications.getActiveBranch, { branchId });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const dismiss = useMutation(api.notifications.dismiss);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  // Only show top 3 most important
  const topNotifications = notifications
    .sort((a: { severity: string }, b: { severity: string }) => {
      const severityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    })
    .slice(0, 3);

  const handleDismiss = async (notificationId: Id<"notifications">) => {
    try {
      await dismiss({ notificationId });
      toast.success("تم إخفاء الإشعار");
    } catch (error) {
      toast.error("فشل إخفاء الإشعار");
    }
  };

  const handleView = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (severity === "critical") {
      return <AlertCircleIcon className="size-5 text-red-600" />;
    }
    
    switch (type) {
      case "error":
        return <AlertCircleIcon className="size-5 text-red-600" />;
      case "warning":
        return <AlertTriangleIcon className="size-5 text-orange-600" />;
      case "success":
        return <CheckCircleIcon className="size-5 text-green-600" />;
      case "info":
      default:
        return <InfoIcon className="size-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-600 bg-red-50 dark:bg-red-950/20";
      case "high":
        return "border-orange-600 bg-orange-50 dark:bg-orange-950/20";
      case "medium":
        return "border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
      default:
        return "border-blue-600 bg-blue-50 dark:bg-blue-950/20";
    }
  };

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {topNotifications.map((notification: { _id: Id<"notifications">; _creationTime: number; type: string; severity: string; title: string; message: string; aiGenerated: boolean; actionRequired?: boolean; reasoning?: string }) => (
          <motion.div
            key={notification._id}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, x: 100, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`border-l-4 ${getSeverityColor(notification.severity)} transition-all`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getIcon(notification.type, notification.severity)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {notification.title}
                        </h4>
                        
                        {notification.aiGenerated && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <SparklesIcon className="size-3" />
                            <span>AI</span>
                          </div>
                        )}
                        
                        {notification.actionRequired && (
                          <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                            يتطلب إجراء
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {notification.reasoning && (
                        <details className="text-xs text-muted-foreground mt-2">
                          <summary className="cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
                            <BrainIcon className="size-3" />
                            <span className="font-medium">سلسلة التفكير (Reasoning Chain)</span>
                          </summary>
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap">
                            {notification.reasoning}
                          </div>
                        </details>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(notification._creationTime).toLocaleString("ar-EG", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        
                        <span className="text-xs font-medium">
                          {notification.severity === "critical" && "🔴 حرج"}
                          {notification.severity === "high" && "🟠 عالي"}
                          {notification.severity === "medium" && "🟡 متوسط"}
                          {notification.severity === "low" && "🔵 منخفض"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => handleDismiss(notification._id)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
