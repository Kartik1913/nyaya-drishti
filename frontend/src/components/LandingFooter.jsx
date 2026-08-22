export default function LandingFooter() {
  return (
    <footer className="bg-surface-dim border-t border-outline-variant w-full mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-stack-lg w-full max-w-7xl mx-auto gap-stack-md md:gap-0">
        <div className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
          Nyaya-Drishti
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-left">
          © {new Date().getFullYear()} Nyaya Judicial Infrastructure
          Platform. Evidence-based Triage System.
        </div>
        <div className="flex gap-4 font-body-sm text-body-sm text-on-surface-variant">
          <a href="#privacy" className="hover:text-secondary transition-colors cursor-pointer">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-secondary transition-colors cursor-pointer">
            Terms of Service
          </a>
          <a href="#compliance" className="hover:text-secondary transition-colors cursor-pointer">
            Compliance
          </a>
          <a href="#legal" className="hover:text-secondary transition-colors cursor-pointer">
            Legal Disclaimer
          </a>
        </div>
      </div>
    </footer>
  );
}
