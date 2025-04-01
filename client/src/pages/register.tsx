import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Sign up to start sharing your practice videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login">
                <a className="font-medium text-primary-500 hover:text-primary-600">
                  Log in
                </a>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
