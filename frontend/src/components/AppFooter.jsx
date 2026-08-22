export default function AppFooter() {
  return (
    <footer className="w-full py-4 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-t border-outline-variant mt-auto text-body-sm font-body-sm text-on-surface-variant shrink-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
        <span>
          © {new Date().getFullYear()} Judicial Infrastructure Services.
          Confidential &amp; Proprietary.
        </span>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
          <a href="#audit" className="hover:text-primary transition-colors">
            Security Audit
          </a>
        </div>
      </div>
    </footer>
  );
}
