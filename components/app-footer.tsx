export function AppFooter() {
  return (
    <footer className="bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Invoxa. All rights reserved. Developed by{" "}
            <a
              href="https://github.com/zodyking/Invoxa.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              Brandon King
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

