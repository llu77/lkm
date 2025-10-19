import { Link } from "react-router-dom";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type PostCardProps = {
  post: Doc<"posts">;
  user: Doc<"users">;
};

export default function PostCard({ post, user }: PostCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="size-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link
            to={`/profile/${user.username}`}
            className="text-sm font-semibold hover:underline"
          >
            {user.username}
          </Link>
        </div>
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.caption || "Post"}
            className="size-full object-cover"
          />
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="size-8">
              <HeartIcon className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8">
              <MessageCircleIcon className="size-5" />
            </Button>
          </div>
          {post.likeCount > 0 && (
            <p className="text-sm font-semibold">
              {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
            </p>
          )}
          {post.caption && (
            <p className="text-sm">
              <Link
                to={`/profile/${user.username}`}
                className="font-semibold hover:underline"
              >
                {user.username}
              </Link>{" "}
              {post.caption}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
