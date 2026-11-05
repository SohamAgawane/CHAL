import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonStyles } from "@/components/Button";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        message="The link may be broken, or the plan may have been removed."
        action={<Link to="/browse" className={buttonStyles()}>Browse plans</Link>}
      />
    </div>
  );
}
