import { Link } from "react-router-dom";
import { CameraIcon, HomeIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";

export default function Header() {
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <CameraIcon className="size-6" />
            <span className="hidden font-bold sm:inline-block">Instagram</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Authenticated>
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <HomeIcon className="size-5" />
                </Link>
              </Button>
              {currentUser && (
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/profile/${currentUser.username}`}>
                    <Avatar className="size-8">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>
                        <UserIcon className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>
              )}
            </nav>
          </Authenticated>
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
