import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = TooltipPrimitive.Content; // Ensure this line is present!

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
