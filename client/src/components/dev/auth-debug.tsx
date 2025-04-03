import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function AuthDebugPanel() {
  const { user, session, loading, isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 p-4 bg-black/80 text-white rounded-xl shadow-xl text-sm space-y-2 border border-white/10 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <span className="font-semibold">🔧 Auth Debug</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            signOut();
            toast({
              title: "Logged out",
              description: "You have been signed out.",
            });
          }}
        >
          Logout
        </Button>
      </div>
      <div>
        <strong>Status:</strong> {loading ? "Loading..." : isAuthenticated ? "✅ Authenticated" : "🚫 Not Authenticated"}
      </div>
      <div>
        <strong>User:</strong>
        <pre className="whitespace-pre-wrap break-words max-h-32 overflow-auto bg-white/10 p-1 rounded">
          {user ? JSON.stringify(user, null, 2) : "null"}
        </pre>
      </div>
      <div>
        <strong>Session:</strong>
        <pre className="whitespace-pre-wrap break-words max-h-32 overflow-auto bg-white/10 p-1 rounded">
          {session ? JSON.stringify(session, null, 2) : "null"}
        </pre>
      </div>
    </div>
  );
}
