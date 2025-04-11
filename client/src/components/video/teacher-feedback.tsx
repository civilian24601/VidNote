import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@client/src/components/ui/button";
import { Badge } from "@client/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@client/src/components/ui/tabs";
import { getInitials, getAvatarColor, formatDateTime } from "@client/src/lib/utils";
import { formatTimestamp, COMMENT_CATEGORIES } from "./categorized-comments";
import { Comment, User } from "@schema";

interface TeacherWithComments {
  teacher: User;
  commentCount: number;
  categories: Record<string, number>;
}

interface TeacherFeedbackProps {
  comments: Comment[];
  onExportFeedback: () => void;
  onSeek: (time: number) => void;
}

export default function TeacherFeedback({ 
  comments, 
  onExportFeedback,
  onSeek
}: TeacherFeedbackProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Process comments to group by teacher
  const getTeachersWithComments = () => {
    const teacherComments: Record<number, TeacherWithComments> = {};
    
    comments.forEach(comment => {
      if (!comment.user || comment.user.role !== "teacher") return;
      
      if (!teacherComments[comment.user.id]) {
        teacherComments[comment.user.id] = {
          teacher: comment.user,
          commentCount: 0,
          categories: {}
        };
      }
      
      teacherComments[comment.user.id].commentCount++;
      
      const category = comment.category || "general";
      teacherComments[comment.user.id].categories[category] = 
        (teacherComments[comment.user.id].categories[category] || 0) + 1;
    });
    
    return Object.values(teacherComments).sort((a, b) => b.commentCount - a.commentCount);
  };
  
  const teachersWithComments = getTeachersWithComments();
  
  // Filter comments by active tab (all or teacher ID)
  const filteredComments = activeTab === "all" 
    ? comments.filter(c => c.user && c.user.role === "teacher")
    : comments.filter(c => c.user && c.user.id.toString() === activeTab);
  
  const getFeedbackSummary = () => {
    const categoryCounts: Record<string, number> = {};
    let totalComments = 0;
    
    comments.forEach(comment => {
      if (!comment.user || comment.user.role !== "teacher") return;
      
      totalComments++;
      const category = comment.category || "general";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return {
      totalComments,
      categoryCounts
    };
  };
  
  const summary = getFeedbackSummary();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Teacher Feedback Summary</h3>
        <Button 
          variant="outline" 
          className="border-gray-700 text-sm"
          onClick={onExportFeedback}
        >
          <i className="ri-file-text-line mr-1.5"></i>
          Export Feedback
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary.totalComments}</div>
            <p className="text-xs text-gray-400 mt-1">
              From {teachersWithComments.length} teachers
            </p>
          </CardContent>
        </Card>
        
        {/* Top 3 Categories */}
        {Object.entries(summary.categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, count]) => {
            const categoryInfo = COMMENT_CATEGORIES[category as keyof typeof COMMENT_CATEGORIES];
            return (
              <Card key={category} className="glassmorphism border-gray-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{count}</div>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.round(count / summary.totalComments * 100)}% of feedback
                  </p>
                </CardContent>
              </Card>
            );
          })
        }
      </div>
      
      {/* Teacher Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-900/50 overflow-x-auto w-full min-h-0 h-auto p-1 flex">
          <TabsTrigger value="all" className="h-auto py-1.5">
            All Teachers
          </TabsTrigger>
          
          {teachersWithComments.map(({ teacher }) => (
            <TabsTrigger key={teacher.id} value={teacher.id.toString()} className="h-auto py-1.5 flex items-center gap-1">
              <Avatar className={`h-5 w-5 ${getAvatarColor(teacher.id)}`}>
                <AvatarFallback className="text-xs">
                  {getInitials(teacher.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[80px] truncate">{teacher.fullName}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p>No teacher feedback available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map(comment => {
                const categoryInfo = comment.category 
                  ? COMMENT_CATEGORIES[comment.category as keyof typeof COMMENT_CATEGORIES]
                  : COMMENT_CATEGORIES.general;
                  
                return (
                  <div key={comment.id} className="p-3 rounded-md bg-gray-800/40 border border-gray-700">
                    <div className="flex items-start gap-3">
                      <Avatar className={`h-8 w-8 ${getAvatarColor(comment.user.id)}`}>
                        <AvatarFallback className="text-sm">
                          {getInitials(comment.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{comment.user.fullName}</span>
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                          {comment.timestamp !== null && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-auto px-2 text-xs rounded-full bg-gray-700/50"
                              onClick={() => onSeek(comment.timestamp || 0)}
                            >
                              <i className="ri-time-line mr-1"></i>
                              {formatTimestamp(comment.timestamp || 0)}
                            </Button>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-300">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}