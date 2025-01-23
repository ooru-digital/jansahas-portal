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
            <img src="/Logo.png" alt="CredIssuer Logo" className="h-5 w-5" />
            <span className="text-sm font-medium text-gray-900">CredIssuer</span>
          </a>
        </div>
      </div>
    );
  }
  