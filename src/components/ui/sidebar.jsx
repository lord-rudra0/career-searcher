import React, { useState, useEffect, useMemo, useCallback, useContext, createContext } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SidebarContext = createContext(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = ({ defaultOpen = true, className, children, ...props }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = window.innerWidth < 768;

  const toggleSidebar = useCallback(() => {
    isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const contextValue = useMemo(() => ({ open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }), [open, isMobile, openMobile, toggleSidebar]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div className={cn("flex min-h-screen w-full", className)} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
};

const Sidebar = ({ className, children, ...props }) => {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent className="w-72 bg-sidebar text-sidebar-foreground">{children}</SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("fixed inset-y-0 w-64 bg-sidebar text-sidebar-foreground", className)} {...props}>
      {children}
    </div>
  );
};

const SidebarTrigger = ({ className, ...props }) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button className={cn("h-7 w-7", className)} onClick={toggleSidebar} {...props}>
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

const SidebarContent = ({ className, ...props }) => (
  <div className={cn("flex flex-col p-4", className)} {...props} />
);

const SidebarHeader = ({ className, ...props }) => (
  <div className={cn("p-4 font-bold", className)} {...props} />
);

const SidebarFooter = ({ className, ...props }) => (
  <div className={cn("p-4 text-sm", className)} {...props} />
);

const SidebarMenu = ({ className, ...props }) => (
  <ul className={cn("flex flex-col space-y-2", className)} {...props} />
);

const SidebarMenuItem = ({ className, ...props }) => (
  <li className={cn("p-2 hover:bg-gray-700", className)} {...props} />
);

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
