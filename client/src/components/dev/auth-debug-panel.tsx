import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AuthDebugPanel() {
  const { user, session, isAuthenticated, loading, signOut } = useAuth();
  const [visible, setVisible] = useState(false);

  // Prevent rendering in production
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        className="text-xs"
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Hide Auth Debug" : "Show Auth Debug"}
      </Button>

      {visible && (
        <Card className="mt-2 w-[320px] p-4 text-xs shadow-lg border bg-background text-foreground space-y-2 max-h-[400px] overflow-auto">
          <div className="font-semibold">🔐 Auth Debug Panel</div>

          <div>
            <strong>isAuthenticated:</strong> {isAuthenticated ? "✅ true" : "❌ false"}
          </div>
          <div>
            <strong>loading:</strong> {loading ? "⏳ true" : "✅ false"}
          </div>

          <div>
            <strong>user:</strong>
            <pre className="whitespace-pre-wrap break-words">
              {user ? JSON.stringify(user, null, 2) : "null"}
            </pre>
          </div>

          <div>
            <strong>session:</strong>
            <pre className="whitespace-pre-wrap break-words">
              {session ? JSON.stringify(session, null, 2) : "null"}
            </pre>
          </div>

          <div className="pt-2 border-t border-gray-700/40 flex justify-between">
            <Button
              variant="destructive"
              className="text-xs"
              onClick={signOut}
            >
              🔓 Log out
            </Button>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => location.reload()}
            >
              🔄 Reload Page
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 
