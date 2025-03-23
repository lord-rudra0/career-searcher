import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function ToggleDemo() {
  return (
    <ToggleGroup type="single" size="lg" variant="outline" defaultValue="bold">
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  )
}
