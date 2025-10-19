import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import Header from "@/components/header.tsx";
import UploadPhotoDialog from "@/components/upload-photo-dialog.tsx";
import PostCard from "@/components/post-card.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { ImageIcon } from "lucide-react";

function FeedContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const posts = useQuery(api.posts.getCurrentUserPosts);

  if (!currentUser || posts === undefined) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="container max-w-2xl py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              Start sharing your moments by uploading your first photo!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-8">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} user={currentUser} />
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Unauthenticated>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-4xl text-balance font-bold tracking-tight">
              Welcome to Instagram
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sign in to share photos and connect with friends
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container max-w-2xl py-8">
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <FeedContent />
        <UploadPhotoDialog />
      </Authenticated>
    </div>
  );
}
