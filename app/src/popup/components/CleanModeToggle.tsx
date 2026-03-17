interface CleanModeToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function CleanModeToggle({ checked, onChange }: CleanModeToggleProps) {
  return (
    <div className="card p-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-primary-600 bg-secondary-100 border-secondary-300 rounded focus:ring-primary-500"
        />
        <div>
          <p className="text-xs font-medium text-secondary-700">Clean Content Mode</p>
          <p className="text-xs text-secondary-500">
            Remove ads, navigation, and noise elements
          </p>
        </div>
      </label>
    </div>
  );
}
