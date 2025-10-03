export default function FormInput({
  label,
  type = "text",
  placeholder = "",
  required,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-sm mb-1">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
