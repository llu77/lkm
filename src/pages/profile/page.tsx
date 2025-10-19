import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import Header from "@/components/header.tsx";
import PostCard from "@/components/post-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function ProfileContent() {
  const { username } = useParams<{ username: string }>();
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const user = useQuery(api.users.getUserByUsername, username ? { username } : "skip");
  const currentUser = useQuery(api.users.getCurrentUser);
  const posts = useQuery(
    api.posts.getUserPosts,
    user ? { userId: user._id } : "skip",
  );
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user ? { userId: user._id } : "skip",
  );

  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);

  if (!username) {
    return (
      <div className="container max-w-4xl py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>User not found</EmptyTitle>
            <EmptyDescription>
              The username you're looking for doesn't exist.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (user === undefined || posts === undefined || currentUser === undefined) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-8">
          <div className="flex items-center gap-8">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>User not found</EmptyTitle>
            <EmptyDescription>
              The username you're looking for doesn't exist.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === user._id;

  const handleFollow = async () => {
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser({ followingId: user._id });
        toast.success(`Unfollowed ${user.username}`);
      } else {
        await followUser({ followingId: user._id });
        toast.success(`Following ${user.username}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        {/* Profile header */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <Avatar className="size-32 border-2">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-4xl">
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-semibold">{user.username}</h1>
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {isFollowing ? "Unfollowing..." : "Following..."}
                    </>
                  ) : isFollowing ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <span className="font-semibold">{posts.length}</span> posts
              </div>
              <div>
                <span className="font-semibold">{user.followerCount}</span>{" "}
                followers
              </div>
              <div>
                <span className="font-semibold">{user.followingCount}</span>{" "}
                following
              </div>
            </div>
            {user.name && <p className="font-semibold">{user.name}</p>}
            {user.bio && <p className="whitespace-pre-wrap">{user.bio}</p>}
          </div>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImageIcon />
              </EmptyMedia>
              <EmptyTitle>No posts yet</EmptyTitle>
              <EmptyDescription>
                {isOwnProfile
                  ? "Start sharing your moments by uploading your first photo!"
                  : `${user.username} hasn't posted anything yet.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post._id}
                className="aspect-square overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Post"}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Unauthenticated>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-4xl text-balance font-bold tracking-tight">
              Sign in to view profiles
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join Instagram to discover and connect with people
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container max-w-4xl py-8">
          <div className="space-y-8">
            <div className="flex items-center gap-8">
              <Skeleton className="size-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <ProfileContent />
      </Authenticated>
    </div>
  );
}
