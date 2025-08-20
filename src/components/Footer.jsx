export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-6 md:px-8 mx-auto py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-semibold text-foreground">
            career<span className="text-primary">finder</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/60">
            <span> {new Date().getFullYear()} CareerFinder. All rights reserved.</span>
            <a href="#" className="hover:text-foreground/80 transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground/80 transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground/80 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}