import MobileLayout from "@/components/rewardz/MobileLayout";

function Key({ label, sub }: { label: string; sub?: string }) {
  return (
    <button className="h-16 w-16 rounded-full bg-gray-200 flex flex-col items-center justify-center text-xl">
      {label}
      {sub && <span className="text-[10px] text-gray-600 -mt-1">{sub}</span>}
    </button>
  );
}

export default function Dialer() {
  return (
    <MobileLayout>
      <div className="mt-6 grid grid-cols-3 gap-5 place-items-center">
        {[
          ["1", ""],
          ["2", "ABC"],
          ["3", "DEF"],
          ["4", "GHI"],
          ["5", "JKL"],
          ["6", "MNO"],
          ["7", "PQRS"],
          ["8", "TUV"],
          ["9", "WXYZ"],
          ["*", ""],
          ["0", ""],
          ["#", ""],
        ].map(([l, s]) => (
          <Key key={l} label={l} sub={s || undefined} />
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button className="h-14 w-14 rounded-full bg-green-500" />
      </div>
    </MobileLayout>
  );
}
