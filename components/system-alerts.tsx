import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle } from "lucide-react"
import type { Alert } from "@/types/aircraft"

interface SystemAlertsProps {
  alerts: Alert[]
}

export function SystemAlerts({ alerts }: SystemAlertsProps) {
  return (
    <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-white">System Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border backdrop-blur-sm ${
                  alert.type === "emergency"
                    ? "bg-red-500/10 border-red-500/30"
                    : alert.type === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === "emergency"
                        ? "bg-red-500 animate-ping"
                        : alert.type === "warning"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">{alert.message}</div>
                    <div className="text-xs text-slate-400">{alert.time}</div>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>No active alerts</div>
                <div className="text-xs mt-1">System operating normally</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
