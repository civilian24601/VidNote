import { useState } from "react";
import { User, Comment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatDateTime, getInitials, getAvatarColor } from "@/lib/utils";

// Enhanced typing for comments with user details
interface CommentWithUser extends Omit<Comment, 'createdAt'> {
  user: Omit<User, "password">;
  createdAt: string | Date | null;
}

interface TeacherFeedbackProps {
  comments: CommentWithUser[];
  onJumpToTimestamp: (timestamp: number) => void;
}

export function TeacherFeedback({ comments, onJumpToTimestamp }: TeacherFeedbackProps) {
  const [activeTeacherId, setActiveTeacherId] = useState<number | null>(null);
  
  // Extract unique teachers from comments
  const teachers = comments
    .filter(comment => comment.user.role === 'teacher')
    .reduce((acc: Omit<User, "password">[], curr) => {
      if (!acc.some(t => t.id === curr.user.id)) {
        acc.push(curr.user);
      }
      return acc;
    }, []);
  
  // Group comments by teachers
  const commentsByTeacher = teachers.reduce((acc: Record<number, CommentWithUser[]>, teacher) => {
    acc[teacher.id] = comments.filter(c => c.user.id === teacher.id);
    return acc;
  }, {});
  
  // Group comments by category for each teacher
  const getCommentsByCategory = (teacherId: number) => {
    const teacherComments = commentsByTeacher[teacherId] || [];
    return teacherComments.reduce((acc: Record<string, CommentWithUser[]>, comment) => {
      const category = comment.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(comment);
      return acc;
    }, {});
  };
  
  // Count feedback by category across all teachers
  const feedbackSummary = comments
    .filter(comment => comment.user.role === 'teacher')
    .reduce((acc: Record<string, number>, comment) => {
      const category = comment.category || 'General';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  
  // Filter comments based on selected teacher
  const filteredComments = activeTeacherId 
    ? comments.filter(c => c.user.id === activeTeacherId)
    : comments.filter(c => c.user.role === 'teacher');
  
  return (
    <div className="card glassmorphism rounded-xl overflow-hidden border-primary/10">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gradient">Teacher Feedback</h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-sm flex items-center text-gray-300 hover:text-white hover:bg-gray-800/50">
              <i className="ri-filter-line mr-1"></i>
              Filter by Teacher
              <i className="ri-arrow-down-s-line ml-1"></i>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glassmorphism text-white border-gray-700">
            <DropdownMenuLabel>Teachers</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem 
              className={activeTeacherId === null ? "bg-gray-800/50" : ""}
              onClick={() => setActiveTeacherId(null)}
            >
              <i className="ri-user-star-line mr-2"></i>
              All Teachers
            </DropdownMenuItem>
            
            {teachers.map(teacher => (
              <DropdownMenuItem 
                key={teacher.id}
                className={activeTeacherId === teacher.id ? "bg-gray-800/50" : ""}
                onClick={() => setActiveTeacherId(teacher.id)}
              >
                <div className="flex items-center">
                  <Avatar className={`h-6 w-6 mr-2 ${getAvatarColor(teacher.id)}`}>
                    <AvatarFallback className="text-xs text-white">
                      {getInitials(teacher.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  {teacher.fullName}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {teachers.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <i className="ri-user-star-line block text-3xl mb-2 text-primary/50"></i>
          <p>No teacher feedback yet</p>
          <p className="text-sm">Share this video with a teacher to receive feedback</p>
        </div>
      ) : (
        <div className="p-4">
          {activeTeacherId ? (
            // Single teacher view
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {teachers.filter(t => t.id === activeTeacherId).map(teacher => (
                  <div key={teacher.id} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/30">
                    <Avatar className={`h-8 w-8 ${getAvatarColor(teacher.id)}`}>
                      <AvatarFallback className="text-sm text-white">
                        {getInitials(teacher.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{teacher.fullName}</div>
                      <div className="text-xs text-gray-400">
                        {commentsByTeacher[teacher.id]?.length || 0} comments
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-md mb-4 bg-gray-900/50">
                  <TabsTrigger value="all">All Feedback</TabsTrigger>
                  <TabsTrigger value="by-category">By Category</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-0">
                  {filteredComments.map(comment => (
                    <div key={comment.id} className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2 mb-1">
                          {comment.category && (
                            <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                              {comment.category}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 flex items-center text-primary font-medium rounded hover:bg-gray-800/50"
                          onClick={() => onJumpToTimestamp(comment.timestamp)}
                        >
                          <i className="ri-play-circle-line mr-1"></i>
                          {Math.floor(comment.timestamp / 60)}:
                          {(comment.timestamp % 60).toString().padStart(2, "0")}
                        </Button>
                      </div>
                      <div className="mt-1 text-gray-300">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="by-category" className="mt-0">
                  {Object.entries(getCommentsByCategory(activeTeacherId)).map(([category, comments]) => (
                    <div key={category} className="mb-4">
                      <h3 className="text-sm font-medium text-primary mb-2 flex items-center">
                        <i className="ri-price-tag-3-line mr-1"></i>
                        {category} ({comments.length})
                      </h3>
                      <div className="space-y-3">
                        {comments.map(comment => (
                          <div key={comment.id} className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-gray-400">
                                {formatDateTime(comment.createdAt)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 flex items-center text-primary font-medium rounded hover:bg-gray-800/50"
                                onClick={() => onJumpToTimestamp(comment.timestamp)}
                              >
                                <i className="ri-play-circle-line mr-1"></i>
                                {Math.floor(comment.timestamp / 60)}:
                                {(comment.timestamp % 60).toString().padStart(2, "0")}
                              </Button>
                            </div>
                            <div className="mt-1 text-gray-300">
                              {comment.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // All teachers summary view
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {teachers.map(teacher => (
                  <div 
                    key={teacher.id} 
                    className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50"
                    onClick={() => setActiveTeacherId(teacher.id)}
                  >
                    <Avatar className={`h-8 w-8 ${getAvatarColor(teacher.id)}`}>
                      <AvatarFallback className="text-sm text-white">
                        {getInitials(teacher.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{teacher.fullName}</div>
                      <div className="text-xs text-gray-400">
                        {commentsByTeacher[teacher.id]?.length || 0} feedback items
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-3">Feedback by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(feedbackSummary).map(([category, count]) => (
                    <div key={category} className="p-3 rounded-lg bg-gray-800/30 text-center">
                      <div className="font-medium text-primary text-lg">{count}</div>
                      <div className="text-xs text-gray-300">{category}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-medium mb-3">Recent Feedback</h3>
                {filteredComments
                  .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .slice(0, 3)
                  .map(comment => (
                    <div key={comment.id} className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Avatar className={`h-6 w-6 ${getAvatarColor(comment.user.id)}`}>
                            <AvatarFallback className="text-xs text-white">
                              {getInitials(comment.user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.user.fullName}</span>
                          {comment.category && (
                            <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                              {comment.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 flex items-center text-primary font-medium rounded hover:bg-gray-800/50"
                          onClick={() => onJumpToTimestamp(comment.timestamp)}
                        >
                          <i className="ri-play-circle-line mr-1"></i>
                          {Math.floor(comment.timestamp / 60)}:
                          {(comment.timestamp % 60).toString().padStart(2, "0")}
                        </Button>
                      </div>
                      <div className="mt-1 text-gray-300">
                        {comment.content}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {formatDateTime(comment.createdAt)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}