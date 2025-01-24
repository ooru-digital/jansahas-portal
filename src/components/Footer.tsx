export default function Footer() {
    return (
      <div className="bg-white border-t border-gray-200 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600">Powered by</span>
          <a
            href="https://credissuer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            <img src="/credissuer-logo.png" alt="CredIssuer Logo" className="h-6 w-26" />
          </a>
        </div>
      </div>
    );
  }
  