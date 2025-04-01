import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getInitials, getAvatarColor } from "@/lib/utils";

// Mock data for student groups
const mockGroups = [
  { 
    id: 1, 
    name: "Piano Beginners", 
    students: [1, 3, 5],
    instrument: "Piano",
    level: "Beginner"
  },
  { 
    id: 2, 
    name: "Violin Intermediates", 
    students: [2, 6],
    instrument: "Violin",
    level: "Intermediate"
  },
  { 
    id: 3, 
    name: "Advanced Students", 
    students: [4, 7, 8],
    instrument: "Mixed",
    level: "Advanced"
  }
];

interface StudentType {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface StudentGroupsProps {
  students: StudentType[];
}

export function StudentGroups({ students }: StudentGroupsProps) {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // Get students in a group
  const getStudentsInGroup = (groupId: number) => {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) return [];
    return students.filter(student => group.students.includes(student.id));
  };

  const handleViewGroup = (groupId: number) => {
    setSelectedGroup(groupId);
    setIsManageDialogOpen(true);
  };

  // Create new group handler (would connect to API in real implementation)
  const handleCreateGroup = () => {
    toast({
      title: "Group created",
      description: "Your new student group has been created successfully.",
    });
    setIsCreateDialogOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Student Groups</h2>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <i className="ri-group-line mr-1.5"></i>
          New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockGroups.map((group) => {
          const groupStudents = getStudentsInGroup(group.id);
          return (
            <Card 
              key={group.id} 
              className="glassmorphism border-gray-700 text-white hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => handleViewGroup(group.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <p className="text-sm text-gray-400">{group.instrument} • {group.level}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-2">
                    {groupStudents.length} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2 mb-2">
                  {groupStudents.slice(0, 4).map((student) => (
                    <Avatar key={student.id} className={`h-8 w-8 border-2 border-gray-900 ${getAvatarColor(student.id)}`}>
                      <AvatarFallback className="text-xs text-white">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {groupStudents.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs border-2 border-gray-900">
                      +{groupStudents.length - 4}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 text-sm mt-3">
                  <div className="flex items-center text-gray-400">
                    <i className="ri-calendar-line mr-1"></i>
                    <span>Classes: {Math.floor(Math.random() * 5) + 1}/week</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <i className="ri-user-star-line mr-1"></i>
                    <span>Top active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gradient">Create Student Group</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new group to organize your students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" placeholder="e.g. Piano Beginners" className="bg-gray-800 border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="instrument">Instrument</Label>
                <Select>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="violin">Violin</SelectItem>
                    <SelectItem value="guitar">Guitar</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Level</Label>
                <Select>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 mt-2">
              <Label>Add Students</Label>
              <div className="max-h-[180px] overflow-y-auto pr-2 space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2 p-2 rounded bg-gray-800/60">
                    <Checkbox id={`student-${student.id}`} className="border-gray-600" />
                    <Label htmlFor={`student-${student.id}`} className="flex-1 flex items-center space-x-2 cursor-pointer">
                      <Avatar className={`h-7 w-7 ${getAvatarColor(student.id)}`}>
                        <AvatarFallback className="text-xs text-white">
                          {getInitials(student.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{student.fullName}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} className="btn-gradient">Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Group Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gradient">
              {selectedGroup !== null ? mockGroups.find(g => g.id === selectedGroup)?.name : "Group"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage students in this group or assign class activities.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup !== null && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Students</h3>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <i className="ri-user-add-line mr-1"></i> Add
                </Button>
              </div>
              <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                {getStudentsInGroup(selectedGroup).map((student) => (
                  <div key={student.id} className="flex items-center justify-between space-x-2 p-2 rounded bg-gray-800/60">
                    <div className="flex items-center space-x-2">
                      <Avatar className={`h-7 w-7 ${getAvatarColor(student.id)}`}>
                        <AvatarFallback className="text-xs text-white">
                          {getInitials(student.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{student.fullName}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white">
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                ))}
              </div>
              
              <hr className="border-gray-700" />
              
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Group Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-gray-700">
                  <i className="ri-mail-send-line mr-1.5"></i> Message
                </Button>
                <Button variant="outline" className="border-gray-700">
                  <i className="ri-clipboard-line mr-1.5"></i> Assignment
                </Button>
                <Button variant="outline" className="border-gray-700">
                  <i className="ri-calendar-event-line mr-1.5"></i> Schedule
                </Button>
                <Button variant="outline" className="border-gray-700 text-red-400 hover:text-red-300 hover:border-red-800/50 hover:bg-red-950/20">
                  <i className="ri-delete-bin-line mr-1.5"></i> Delete
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              toast({
                title: "Group updated",
                description: "Group changes have been saved successfully.",
              });
              setIsManageDialogOpen(false);
            }} className="btn-gradient">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}