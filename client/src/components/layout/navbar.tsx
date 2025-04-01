import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <nav className="header sticky top-0 z-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-md bg-primary/80 flex items-center justify-center">
                    <i className="ri-movie-2-line text-white text-lg"></i>
                  </div>
                  <span className="font-bold text-xl text-gradient">VidNote</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="btn-gradient">Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="header sticky top-0 z-10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 rounded-md bg-primary/80 flex items-center justify-center">
                  <i className="ri-movie-2-line text-white text-lg"></i>
                </div>
                <span className="font-bold text-xl text-gradient">VidNote</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user?.role === "student" ? (
                // Student navigation options
                <>
                  <Link href="/videos" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/videos" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-video-line mr-1.5"></i>My Videos
                  </Link>
                  <Link href="/shared" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/shared" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-feedback-line mr-1.5"></i>Shared with me
                  </Link>
                  <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/dashboard" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-dashboard-line mr-1.5"></i>Dashboard
                  </Link>
                </>
              ) : (
                // Teacher navigation options
                <>
                  <Link href="/students" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/students" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-user-line mr-1.5"></i>Students
                  </Link>
                  <Link href="/shared" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/shared" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-video-line mr-1.5"></i>Pending Reviews
                  </Link>
                  <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/dashboard" 
                      ? "border-primary text-white" 
                      : "border-transparent text-gray-200 hover:text-white hover:border-white/30"
                  }`}>
                    <i className="ri-dashboard-line mr-1.5"></i>Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <button className="p-1 rounded-full text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <i className="ri-question-line text-lg"></i>
            </button>
            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center text-white font-medium">
                      {user && getInitials(user.fullName)}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glassmorphism text-white border-gray-700">
                  <DropdownMenuItem className="font-medium">
                    {user?.fullName}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-sm text-gray-300">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="hover:bg-white/10">
                    <i className="ri-logout-box-line mr-2"></i> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
