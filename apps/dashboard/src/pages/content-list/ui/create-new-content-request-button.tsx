import { Button } from "@packages/ui/components/button";
import { PlusCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CreateNewContentRequestButton() {
  return (
    <Link to="/agents" className="inline-flex">
      <Button className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Create New Content Request
      </Button>
    </Link>
  );
}