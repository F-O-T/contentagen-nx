import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import type { ContentSelect } from "@packages/database/schema";
export function ContentRequestCard({ request }: { request: ContentSelect }) {
  return (
    <Card>
      {request.status === "generating" ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">
            Content is being generated...
          </div>
        </div>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="line-clamp-1">
              {request.title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {request.stats?.qualityScore}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 ">
            <InfoItem
              icon={<Activity className="h-4 w-4" />}
              label="Status"
              value={request.status ?? ""}
            />
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link params={{ id: request.id }} to="/content/$id">
                Manage your content
              </Link>
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
