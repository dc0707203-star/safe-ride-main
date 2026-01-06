import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IdCard, Lock } from "lucide-react";

const StudentLoginForm = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert student ID to email format
      const email = `${studentId.replace(/[^a-zA-Z0-9]/g, '')}@student.isu.edu.ph`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid Student ID or Password');
        }
        throw error;
      }

      toast.success("Successfully logged in!");
      navigate('/student');
    } catch (error: unknown) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pt-6 pb-4">
        <CardTitle className="text-xl font-bold text-foreground text-center">
          Student Login
        </CardTitle>
        <CardDescription className="text-muted-foreground text-center text-sm">
          Enter your Student ID and password provided by the admin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="studentId"
                type="text"
                placeholder="e.g., 2024-12345"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </div>
            ) : "Sign In"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account? Contact your administrator.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentLoginForm;
