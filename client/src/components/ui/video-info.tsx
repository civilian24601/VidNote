import { Button } from "@/components/ui/button";
import { VideoSharing, User } from "@shared/schema";
import { getInitials, getAvatarColor } from "@/lib/utils";

interface VideoInfoProps {
  title: string;
  description: string;
  practiceGoals?: string[];
  sharingUsers: (VideoSharing & { user: Omit<User, "password"> })[];
  onManageSharing: () => void;
  onDownload: () => void;
}

export function VideoInfo({
  title,
  description,
  practiceGoals = [],
  sharingUsers,
  onManageSharing,
  onDownload,
}: VideoInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900">Video Details</h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Title</h3>
          <p className="mt-1">{title}</p>
        </div>
        {description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm text-gray-800">{description}</p>
          </div>
        )}
        {practiceGoals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Practice Goals</h3>
            <ul className="mt-1 text-sm text-gray-800 list-disc list-inside space-y-1">
              {practiceGoals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Shared With</h3>
          {sharingUsers.length > 0 ? (
            <div className="mt-2 flex items-center">
              <div className="flex -space-x-1 overflow-hidden">
                {sharingUsers.slice(0, 5).map((sharing) => (
                  <div
                    key={sharing.id}
                    className={`inline-block h-6 w-6 rounded-full ring-2 ring-white ${getAvatarColor(sharing.user.id)} flex items-center justify-center text-white text-xs`}
                    title={sharing.user.fullName}
                  >
                    {getInitials(sharing.user.fullName)}
                  </div>
                ))}
                {sharingUsers.length > 5 && (
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-white text-xs">
                    +{sharingUsers.length - 5}
                  </div>
                )}
              </div>
              <Button variant="link" size="sm" onClick={onManageSharing} className="ml-2 text-sm text-primary-500 font-medium">
                Manage
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Not shared with anyone yet
              <Button variant="link" size="sm" onClick={onManageSharing} className="ml-1 text-sm text-primary-500 font-medium">
                Share
              </Button>
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full inline-flex justify-center items-center"
            onClick={onDownload}
          >
            <i className="ri-download-2-line mr-1.5"></i>
            Download Video
          </Button>
        </div>
      </div>
    </div>
  );
}
