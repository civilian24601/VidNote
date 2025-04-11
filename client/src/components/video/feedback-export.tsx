import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, formatDateTime } from "@/lib/utils";
import { formatTimestamp, COMMENT_CATEGORIES } from "./categorized-comments";
import { Comment, User, Video } from "@schema";

interface FeedbackExportProps {
  video: Video;
  comments: Comment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackExport({ 
  video, 
  comments, 
  open, 
  onOpenChange 
}: FeedbackExportProps) {
  const [exportFormat, setExportFormat] = useState<"html" | "text" | "pdf">("html");
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [groupByTeacher, setGroupByTeacher] = useState(true);
  const [onlyTeacherComments, setOnlyTeacherComments] = useState(true);
  
  // Get teacher comments
  const teacherComments = comments.filter(c => 
    c.user && c.user.role === "teacher" && (!c.parentId || c.parentId === null)
  );
  
  // Group comments by teacher or category
  const getGroupedComments = () => {
    const filteredComments = onlyTeacherComments
      ? teacherComments
      : comments.filter(c => !c.parentId || c.parentId === null);
      
    if (groupByTeacher) {
      // Group by teacher
      const grouped: Record<number, Comment[]> = {};
      
      filteredComments.forEach(comment => {
        if (!comment.user) return;
        
        if (!grouped[comment.user.id]) {
          grouped[comment.user.id] = [];
        }
        
        grouped[comment.user.id].push(comment);
      });
      
      return grouped;
    } else {
      // Group by category
      const grouped: Record<string, Comment[]> = {};
      
      filteredComments.forEach(comment => {
        const category = comment.category || "general";
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        
        grouped[category].push(comment);
      });
      
      return grouped;
    }
  };
  
  // Get the summary statistics
  const getSummary = () => {
    const categoryCounts: Record<string, number> = {};
    const teacherCounts: Record<number, number> = {};
    let totalComments = 0;
    
    teacherComments.forEach(comment => {
      if (!comment.user) return;
      
      totalComments++;
      
      // Count by category
      const category = comment.category || "general";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Count by teacher
      teacherCounts[comment.user.id] = (teacherCounts[comment.user.id] || 0) + 1;
    });
    
    return {
      totalComments,
      categoryCounts,
      teacherCounts,
      topCategory: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)[0]
    };
  };
  
  const summary = getSummary();
  const groupedComments = getGroupedComments();
  
  // Helper to render a comment in the selected format
  const renderComment = (comment: Comment) => {
    const categoryText = comment.category 
      ? COMMENT_CATEGORIES[comment.category as keyof typeof COMMENT_CATEGORIES]?.label
      : "General";
    
    return (
      <div key={comment.id} className="mb-3 p-3 border border-gray-700 rounded bg-gray-800/50">
        <div className="flex items-start gap-2">
          {comment.user && (
            <Avatar className={`h-6 w-6 ${getAvatarColor(comment.user.id)}`}>
              <AvatarFallback className="text-xs">
                {getInitials(comment.user.fullName)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {comment.user && (
                <span className="font-medium">{comment.user.fullName}</span>
              )}
              
              {includeCategories && comment.category && (
                <Badge className="h-5 text-xs" variant="outline">
                  {categoryText}
                </Badge>
              )}
              
              {includeTimestamps && comment.timestamp !== null && (
                <span className="text-xs text-gray-400">
                  at {formatTimestamp(comment.timestamp || 0)}
                </span>
              )}
              
              <span className="text-xs text-gray-400 ml-auto">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            
            <div className="mt-1 text-sm">
              {comment.content}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Generate export content
  const generateExportContent = () => {
    return (
      <div className="bg-gray-900 text-white p-4 rounded-md max-h-[60vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{video.title}</h2>
          <p className="text-gray-400 mb-4">
            Feedback summary generated on {new Date().toLocaleDateString()}
          </p>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="bg-gray-800 px-3 py-2 rounded-md">
              <div className="text-sm text-gray-400">Total Feedback</div>
              <div className="text-xl font-semibold">{summary.totalComments}</div>
            </div>
            
            {summary.topCategory && (
              <div className="bg-gray-800 px-3 py-2 rounded-md">
                <div className="text-sm text-gray-400">Top Category</div>
                <div className="text-xl font-semibold">
                  {COMMENT_CATEGORIES[summary.topCategory[0] as keyof typeof COMMENT_CATEGORIES]?.label}
                </div>
              </div>
            )}
            
            <div className="bg-gray-800 px-3 py-2 rounded-md">
              <div className="text-sm text-gray-400">Teachers</div>
              <div className="text-xl font-semibold">{Object.keys(summary.teacherCounts).length}</div>
            </div>
          </div>
        </div>
        
        {/* Render comments based on grouping */}
        {groupByTeacher ? (
          <div>
            {Object.entries(groupedComments).map(([teacherId, teacherComments]) => {
              const teacher = teacherComments[0]?.user;
              if (!teacher) return null;
              
              return (
                <div key={teacherId} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className={`h-8 w-8 ${getAvatarColor(teacher.id)}`}>
                      <AvatarFallback className="text-sm">
                        {getInitials(teacher.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold">{teacher.fullName}</h3>
                    <Badge variant="outline" className="ml-2">
                      {teacherComments.length} comments
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-gray-700">
                    {teacherComments.map(comment => renderComment(comment))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {Object.entries(groupedComments).map(([category, categoryComments]) => {
              const categoryInfo = COMMENT_CATEGORIES[category as keyof typeof COMMENT_CATEGORIES] || 
                COMMENT_CATEGORIES.general;
              
              return (
                <div key={category} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${categoryInfo.color} h-6`}>
                      {categoryInfo.label}
                    </Badge>
                    <h3 className="text-lg font-semibold">{categoryInfo.label}</h3>
                    <Badge variant="outline" className="ml-2">
                      {categoryComments.length} comments
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-gray-700">
                    {categoryComments.map(comment => renderComment(comment))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  // Export the feedback
  const handleExport = () => {
    const title = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const content = document.getElementById('export-content');
    
    if (!content) return;
    
    if (exportFormat === 'text') {
      // Export as text
      const plainText = content.innerText;
      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_${title}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'html') {
      // Export as HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Feedback for ${video.title}</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
              .container { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; }
              .header { margin-bottom: 2rem; }
              .header h1 { margin-bottom: 0.5rem; }
              .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
              .stat { background: #f3f4f6; padding: 0.75rem; border-radius: 6px; }
              .stat-label { font-size: 0.875rem; color: #6b7280; }
              .stat-value { font-size: 1.25rem; font-weight: 600; }
              .teacher { margin-bottom: 1.5rem; }
              .teacher-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
              .teacher-avatar { width: 2rem; height: 2rem; border-radius: 9999px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: 600; }
              .teacher-comments { margin-left: 1rem; padding-left: 1rem; border-left: 2px solid #e5e7eb; }
              .comment { margin-bottom: 0.75rem; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px; }
              .comment-header { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
              .comment-content { font-size: 0.9375rem; }
              .badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; background: #e5e7eb; }
              .timestamp { font-size: 0.75rem; color: #6b7280; }
              .category { padding: 0.125rem 0.5rem; border-radius: 9999px; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_${title}.html`;
      a.click();
      
      URL.revokeObjectURL(url);
    }
    
    // Close the dialog
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Export Feedback</DialogTitle>
          <DialogDescription className="text-gray-400">
            Generate a summary of all feedback for this performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          {/* Options Panel */}
          <div className="p-4 bg-gray-800 rounded-md">
            <h3 className="text-sm font-medium mb-3">Export Options</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Export Format</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-html" 
                      checked={exportFormat === "html"} 
                      onChange={() => setExportFormat("html")}
                      className="accent-primary"
                    />
                    <Label htmlFor="format-html" className="text-sm font-normal">
                      HTML Document
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-text" 
                      checked={exportFormat === "text"} 
                      onChange={() => setExportFormat("text")}
                      className="accent-primary"
                    />
                    <Label htmlFor="format-text" className="text-sm font-normal">
                      Plain Text
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-pdf" 
                      checked={exportFormat === "pdf"} 
                      onChange={() => setExportFormat("pdf")}
                      className="accent-primary"
                      disabled
                    />
                    <Label htmlFor="format-pdf" className="text-sm font-normal text-gray-500">
                      PDF (Coming Soon)
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Include</Label>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-categories" 
                      checked={includeCategories}
                      onCheckedChange={(checked) => setIncludeCategories(!!checked)}
                    />
                    <label
                      htmlFor="include-categories"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show comment categories
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-timestamps" 
                      checked={includeTimestamps}
                      onCheckedChange={(checked) => setIncludeTimestamps(!!checked)}
                    />
                    <label
                      htmlFor="include-timestamps"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show timestamps
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Grouping</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="group-teacher" 
                      checked={groupByTeacher} 
                      onChange={() => setGroupByTeacher(true)}
                      className="accent-primary"
                    />
                    <Label htmlFor="group-teacher" className="text-sm font-normal">
                      Group by Teacher
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="group-category" 
                      checked={!groupByTeacher} 
                      onChange={() => setGroupByTeacher(false)}
                      className="accent-primary"
                    />
                    <Label htmlFor="group-category" className="text-sm font-normal">
                      Group by Category
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="teacher-only" 
                  checked={onlyTeacherComments}
                  onCheckedChange={(checked) => setOnlyTeacherComments(!!checked)}
                />
                <label
                  htmlFor="teacher-only"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Teacher comments only
                </label>
              </div>
              
              <Button className="w-full" onClick={handleExport}>
                <i className="ri-download-line mr-1.5"></i>
                Download {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
          
          {/* Preview Panel */}
          <div>
            <h3 className="text-sm font-medium mb-3">Preview</h3>
            <div id="export-content" className="border border-gray-700 rounded-md">
              {generateExportContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}