import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    instrument: user?.role === "student" ? "Piano" : "",
    experience: user?.role === "student" ? "Intermediate" : "Teacher",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const saveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully."
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      
      <main className="container p-4 mx-auto mt-16 mb-24">
        <h1 className="text-3xl font-bold text-gradient mb-2">Profile Settings</h1>
        <p className="text-gray-400 mb-6">Manage your account and preferences</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="glassmorphism border-gray-700 text-white md:col-span-1">
            <CardHeader className="text-center">
              <div className="h-24 w-24 rounded-full bg-primary/30 flex items-center justify-center text-white text-3xl font-medium mx-auto">
                {user && getInitials(user.fullName)}
              </div>
              <CardTitle className="mt-4">{user?.fullName}</CardTitle>
              <CardDescription className="text-gray-400">{user?.email}</CardDescription>
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mt-2">
                {user?.role === "student" ? "Student" : "Teacher"}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user?.role === "student" && (
                  <>
                    <div>
                      <Label className="text-gray-400">Instrument</Label>
                      <p className="font-medium">Piano</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Experience Level</Label>
                      <p className="font-medium">Intermediate</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-gray-400">Member Since</Label>
                  <p className="font-medium">April 2023</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800/50" onClick={logout}>
                <i className="ri-logout-box-line mr-2"></i> Logout
              </Button>
            </CardFooter>
          </Card>
          
          {/* Edit Profile Form */}
          <Card className="glassmorphism border-gray-700 text-white md:col-span-2">
            <CardHeader>
              <CardTitle>
                {isEditing ? "Edit Profile" : "Personal Information"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isEditing ? "Update your personal details" : "Your account information and preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  {user?.role === "student" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instrument">Instrument</Label>
                        <Input
                          id="instrument"
                          name="instrument"
                          value={formData.instrument}
                          onChange={handleInputChange}
                          className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Level</Label>
                        <Input
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <>
                    <Separator className="bg-gray-800" />
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Change Password</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type="password"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="bg-gray-800/30 border-gray-700 text-white focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button variant="outline" className="border-gray-700 hover:bg-gray-800/50" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveProfile}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}