import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface ProgressItem {
  id: number;
  studentId: number;
  assignment: string;
  dueDate: Date | string;
  progress: number; // 0-100
  lastUpdate: Date | string;
  pieces: string[];
}

interface StudentType {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface StudentProgressProps {
  students: StudentType[];
}

// Mock data for student progress
const mockProgress: ProgressItem[] = [
  {
    id: 1,
    studentId: 1,
    assignment: "Weekly Etudes",
    dueDate: new Date(2025, 3, 15),
    progress: 75,
    lastUpdate: new Date(2025, 3, 10),
    pieces: ["Czerny Op. 299 No. 5", "Chopin Etude Op. 10 No. 1"]
  },
  {
    id: 2,
    studentId: 3,
    assignment: "Scale Mastery",
    dueDate: new Date(2025, 3, 20),
    progress: 45,
    lastUpdate: new Date(2025, 3, 9),
    pieces: ["C Major Scale", "G Major Scale", "D Major Scale"]
  },
  {
    id: 3,
    studentId: 2,
    assignment: "Repertoire Development",
    dueDate: new Date(2025, 3, 30),
    progress: 20,
    lastUpdate: new Date(2025, 3, 5),
    pieces: ["Mozart Sonata K.545", "Bach Prelude in C Major"]
  },
  {
    id: 4,
    studentId: 5,
    assignment: "Sight Reading Challenge",
    dueDate: new Date(2025, 3, 25),
    progress: 60,
    lastUpdate: new Date(2025, 3, 12),
    pieces: ["Level 3 Sight Reading Exercises"]
  }
];

export function StudentProgress({ students }: StudentProgressProps) {
  // Get student data from ID
  const getStudent = (id: number) => {
    return students.find(s => s.id === id);
  };

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate: Date | string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get progress status badge
  const getStatusBadge = (progress: number, daysRemaining: number) => {
    if (progress >= 100) {
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Completed</Badge>;
    }
    
    if (daysRemaining < 0) {
      return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Overdue</Badge>;
    }
    
    if (daysRemaining <= 2) {
      return <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">Due Soon</Badge>;
    }
    
    if (progress > 50) {
      return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">In Progress</Badge>;
    }
    
    return <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">Started</Badge>;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Student Progress</h2>
        <Button size="sm" variant="outline" className="border-gray-700">
          <i className="ri-add-line mr-1.5"></i>
          New Assignment
        </Button>
      </div>

      <div className="space-y-4">
        {mockProgress.map((item) => {
          const student = getStudent(item.studentId);
          const daysRemaining = getDaysRemaining(item.dueDate);
          
          if (!student) return null;
          
          return (
            <Card key={item.id} className="glassmorphism border-gray-700 text-white hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar className={`h-10 w-10 ${getAvatarColor(student.id)}`}>
                      <AvatarFallback className="text-white">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base">{student.fullName}</CardTitle>
                        {getStatusBadge(item.progress, daysRemaining)}
                      </div>
                      <p className="text-sm text-gray-400">
                        {item.assignment} • Due {formatDate(item.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium flex items-center justify-end">
                      Progress: {item.progress}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 
                       daysRemaining === 0 ? "Due today" : "Overdue"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-700 h-2 mb-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      item.progress >= 100 ? "bg-green-500" : 
                      daysRemaining < 0 ? "bg-red-400" :
                      daysRemaining <= 2 ? "bg-orange-400" : 
                      "bg-primary"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium mb-1">Assigned Pieces:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.pieces.map((piece, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="bg-gray-800/50 text-gray-300 border-gray-700"
                      >
                        {piece}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between mt-3 text-xs text-gray-400">
                  <span>Last update: {formatDate(item.lastUpdate)}</span>
                  <button className="text-primary hover:underline">View Details</button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}