import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-6">
      <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
        404
      </p>
      <h1 className="font-headline-lg text-headline-lg text-primary">
        Page not found
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-4 bg-navy text-white px-6 py-3 rounded-four font-semibold font-label-md text-label-md hover:opacity-90 transition-opacity"
      >
        Back to home
      </Link>
    </div>
  );
}
