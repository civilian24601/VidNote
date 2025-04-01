import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, getAvatarColor, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: number;
  studentId: number;
  content: string;
  createdAt: Date | string;
  category: "general" | "technique" | "repertoire" | "progress";
}

interface StudentType {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface TeacherNotesProps {
  students: StudentType[];
}

// Mock data for teacher notes
const mockNotes: Note[] = [
  {
    id: 1,
    studentId: 1,
    content: "Emma has made excellent progress on her Bach inventions. Her articulation has improved significantly over the past month. We should focus on pedaling technique in upcoming lessons.",
    createdAt: new Date(2025, 3, 10),
    category: "technique"
  },
  {
    id: 2,
    studentId: 3,
    content: "Michael needs more work on sight reading. Assigned Level 3 exercises to practice daily. He shows good understanding of musical structure but struggles with quick note recognition.",
    createdAt: new Date(2025, 3, 9),
    category: "progress"
  },
  {
    id: 3,
    studentId: 2,
    content: "Sofia's Mozart sonata interpretation is coming along nicely. Still needs work on the development section dynamics. Suggested listening to Uchida's recording as reference.",
    createdAt: new Date(2025, 3, 8),
    category: "repertoire"
  },
  {
    id: 4,
    studentId: 5,
    content: "Notice that James tends to rush through difficult passages. Recommended metronome practice at slower tempos. His finger technique is solid but rhythm needs attention.",
    createdAt: new Date(2025, 3, 7),
    category: "technique"
  },
  {
    id: 5,
    studentId: 1,
    content: "Emma is ready to move on to more advanced repertoire. Thinking of introducing some Chopin nocturnes in the next semester. Her expressiveness has improved dramatically.",
    createdAt: new Date(2025, 3, 5),
    category: "general"
  }
];

export function TeacherNotes({ students }: TeacherNotesProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    studentId: 0,
    content: "",
    category: "general"
  });

  // Get student data from ID
  const getStudent = (id: number) => {
    return students.find(s => s.id === id);
  };

  // Get notes for a student
  const getNotesForStudent = (studentId: number) => {
    return mockNotes.filter(note => note.studentId === studentId);
  };

  // Handle viewing a note
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  // Handle adding a new note
  const handleAddNote = () => {
    toast({
      title: "Note added",
      description: "Your note has been added successfully.",
    });
    setIsAddDialogOpen(false);
    setNewNote({
      studentId: 0,
      content: "",
      category: "general"
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Teacher Notes</h2>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <i className="ri-sticky-note-add-line mr-1.5"></i>
          Add Note
        </Button>
      </div>

      <div className="space-y-4">
        {mockNotes.slice(0, 4).map((note) => {
          const student = getStudent(note.studentId);
          if (!student) return null;
          
          return (
            <Card 
              key={note.id} 
              className="glassmorphism border-gray-700 text-white hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => handleViewNote(note)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className={`h-9 w-9 ${getAvatarColor(student.id)}`}>
                    <AvatarFallback className="text-white text-sm">
                      {getInitials(student.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{student.fullName}</CardTitle>
                    <p className="text-xs text-gray-400">
                      {formatDate(note.createdAt)}
                      {note.category && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                          {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 line-clamp-2">{note.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gradient">Add Teacher Note</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record observations, progress notes, or suggestions for your students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Student</label>
              <select 
                className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                value={newNote.studentId}
                onChange={(e) => setNewNote({...newNote, studentId: parseInt(e.target.value)})}
              >
                <option value={0}>Select a student</option>
                {students.filter(s => s.role === "student").map((student) => (
                  <option key={student.id} value={student.id}>{student.fullName}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                value={newNote.category}
                onChange={(e) => setNewNote({...newNote, category: e.target.value as any})}
              >
                <option value="general">General</option>
                <option value="technique">Technique</option>
                <option value="repertoire">Repertoire</option>
                <option value="progress">Progress</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Note</label>
              <Textarea 
                className="min-h-[150px] bg-gray-800 border-gray-700 text-white" 
                placeholder="Enter your notes here..."
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} className="btn-gradient">Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {selectedNote && (
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                {(() => {
                  const student = getStudent(selectedNote.studentId);
                  if (!student) return null;
                  
                  return (
                    <>
                      <Avatar className={`h-10 w-10 ${getAvatarColor(student.id)}`}>
                        <AvatarFallback className="text-white">
                          {getInitials(student.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <DialogTitle className="text-gradient">{student.fullName}</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Note from {formatDate(selectedNote.createdAt)}
                        </DialogDescription>
                      </div>
                    </>
                  );
                })()}
              </div>
            </DialogHeader>
            
            <div className="py-4">
              <div className="inline-block px-2 py-1 mb-3 bg-gray-800 rounded text-sm">
                {selectedNote.category.charAt(0).toUpperCase() + selectedNote.category.slice(1)}
              </div>
              <div className="text-gray-300 whitespace-pre-wrap">{selectedNote.content}</div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <div>
                <Button variant="outline" className="border-gray-700 text-red-400 hover:text-red-300 hover:border-red-800/50 hover:bg-red-950/20">
                  <i className="ri-delete-bin-line mr-1.5"></i> Delete
                </Button>
              </div>
              <div className="space-x-2">
                <Button variant="outline" className="border-gray-700">Edit</Button>
                <Button variant="ghost" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </DialogFooter>
            
            <Tabs defaultValue="all" className="mt-4">
              <TabsList className="bg-gray-800 grid w-full grid-cols-4">
                <TabsTrigger value="all">All Notes</TabsTrigger>
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
                <TabsTrigger value="recordings">Recordings</TabsTrigger>
                <TabsTrigger value="performances">Performances</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4 border-t border-gray-800 pt-4">
                <h3 className="font-medium mb-3">Other Notes for This Student</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {getNotesForStudent(selectedNote.studentId)
                    .filter(note => note.id !== selectedNote.id)
                    .map(note => (
                      <div key={note.id} className="p-2 rounded bg-gray-800/60 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
                          <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                            {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-300 line-clamp-2">{note.content}</p>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="lessons" className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-center text-gray-400 py-4">Lesson notes will appear here</p>
              </TabsContent>
              <TabsContent value="recordings" className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-center text-gray-400 py-4">Recording notes will appear here</p>
              </TabsContent>
              <TabsContent value="performances" className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-center text-gray-400 py-4">Performance notes will appear here</p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}