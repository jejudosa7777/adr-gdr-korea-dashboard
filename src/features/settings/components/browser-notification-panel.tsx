"use client";

import * as React from "react";
import { Bell, BellRing } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BrowserNotificationPanel() {
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const sendTest = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("DR 괴리율 테스트 알림", {
      body: "[경고] SK하이닉스 GDR 프리미엄 6.25%",
    });
  };

  return (
    <Alert>
      <Bell className="size-4" aria-hidden="true" />
      <AlertTitle>브라우저 알림</AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={permission === "granted" ? "success" : permission === "denied" ? "danger" : "warning"}>
            현재 권한: {permission === "unsupported" ? "미지원" : permission}
          </Badge>
          <Button type="button" variant="outline" onClick={requestPermission} disabled={permission === "unsupported"}>
            권한 요청
          </Button>
          <Button type="button" onClick={sendTest} disabled={permission !== "granted"}>
            <BellRing aria-hidden="true" />
            테스트 알림
          </Button>
        </div>
        {permission === "denied" ? <p>권한이 거부되었습니다. 브라우저 사이트 설정에서 알림 권한을 직접 허용해야 합니다.</p> : null}
        {permission === "unsupported" ? <p>현재 브라우저는 Notification API를 지원하지 않습니다.</p> : null}
      </AlertDescription>
    </Alert>
  );
}
