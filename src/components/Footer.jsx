export default function Footer() {
  return (
    <footer className="py-12 bg-secondary/80">
      <div className="container px-6 md:px-8 mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-2xl font-semibold text-foreground mb-6 md:mb-0">
            career<span className="text-primary">glimpse</span>
          </div>
          <div className="text-sm text-foreground/60">
            © {new Date().getFullYear()} CareerGlimpse. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 