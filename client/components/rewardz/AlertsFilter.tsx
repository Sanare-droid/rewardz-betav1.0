import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { SPECIES_OPTIONS, breedsFor } from "@/lib/options";
import { geocode } from "@/lib/geo";

export type AlertsAdvancedFilter = {
  name?: string;
  species?: string;
  breed?: string;
  color?: string;
  microchip?: string;
  minReward?: number;
  hasPhoto?: boolean;
  location?: string;
  coords?: { lat: number; lon: number } | null;
  radiusKm?: number; // 0..100
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string; // yyyy-mm-dd
};

export default function AlertsFilter({
  open,
  onOpenChange,
  initial,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AlertsAdvancedFilter | null;
  onApply: (f: AlertsAdvancedFilter) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [species, setSpecies] = useState(initial?.species || "");
  const [breed, setBreed] = useState(initial?.breed || "");
  const [color, setColor] = useState(initial?.color || "");
  const [microchip, setMicrochip] = useState(initial?.microchip || "");
  const [minReward, setMinReward] = useState(
    typeof initial?.minReward === "number" ? String(initial?.minReward) : "",
  );
  const [hasPhoto, setHasPhoto] = useState(!!initial?.hasPhoto);
  const [location, setLocation] = useState(initial?.location || "");
  const [radiusKm, setRadiusKm] = useState<number>(initial?.radiusKm || 5);
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom || "");
  const [dateTo, setDateTo] = useState(initial?.dateTo || "");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setSpecies(initial?.species || "");
    setBreed(initial?.breed || "");
    setColor(initial?.color || "");
    setMicrochip(initial?.microchip || "");
    setMinReward(
      typeof initial?.minReward === "number" ? String(initial.minReward) : "",
    );
    setHasPhoto(!!initial?.hasPhoto);
    setLocation(initial?.location || "");
    setRadiusKm(initial?.radiusKm || 5);
    setDateFrom(initial?.dateFrom || "");
    setDateTo(initial?.dateTo || "");
  }, [open]);

  const breeds = useMemo(() => breedsFor(species || ""), [species]);

  const apply = async () => {
    const coords = location ? await geocode(location) : null;
    onApply({
      name: name || undefined,
      species: species || undefined,
      breed: breed || undefined,
      color: color || undefined,
      microchip: microchip || undefined,
      minReward: minReward ? Number(minReward) : undefined,
      hasPhoto,
      location: location || undefined,
      coords,
      radiusKm,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    onOpenChange(false);
  };

  const reset = () => {
    setName("");
    setSpecies("");
    setBreed("");
    setColor("");
    setMicrochip("");
    setMinReward("");
    setHasPhoto(false);
    setLocation("");
    setRadiusKm(5);
    setDateFrom("");
    setDateTo("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Filter</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3">
          <input
            className="w-full h-11 rounded-xl border px-3"
            placeholder="Pet’s name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                className="w-full h-11 rounded-xl border px-3"
                placeholder="Species"
                list="species-list"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              />
              <datalist id="species-list">
                {SPECIES_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <select
                className="w-full h-11 rounded-xl border px-3"
                value={breed}
                disabled={!species}
                onChange={(e) => setBreed(e.target.value)}
              >
                <option value="">Breed</option>
                {breeds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="w-full h-11 rounded-xl border px-3"
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              className="w-full h-11 rounded-xl border px-3"
              placeholder="Microchip ID"
              value={microchip}
              onChange={(e) => setMicrochip(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Location</label>
            <input
              className="w-full h-11 rounded-xl border px-3"
              placeholder="City, area, landmark"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Radius: {radiusKm} km</label>
            <Slider
              min={0}
              max={50}
              step={1}
              value={[radiusKm]}
              onValueChange={(v) => setRadiusKm(v[0] || 0)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Date from</label>
              <input
                type="date"
                className="w-full h-11 rounded-xl border px-3"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date to</label>
              <input
                type="date"
                className="w-full h-11 rounded-xl border px-3"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="w-full h-11 rounded-xl border px-3"
              placeholder="Min reward ($)"
              value={minReward}
              onChange={(e) => setMinReward(e.target.value)}
            />
            <label className="h-11 rounded-xl border px-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasPhoto}
                onChange={(e) => setHasPhoto(e.target.checked)}
              />
              Has photo
            </label>
          </div>
        </div>
        <DrawerFooter className="mt-4 gap-2">
          <button onClick={reset} className="h-11 rounded-full border">
            Reset
          </button>
          <button
            onClick={apply}
            className="h-11 rounded-full bg-[hsl(var(--brand-berry))] text-white"
          >
            Apply
          </button>
          <DrawerClose asChild>
            <button className="h-11 rounded-full border">Close</button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
