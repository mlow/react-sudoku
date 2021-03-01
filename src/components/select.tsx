interface SelectParams<T> {
  options: { key: string; value: T }[];
  onSelect: (value: T) => void;
  value?: T;
  className?: string;
}

export function Select<T>({
  className,
  options,
  onSelect,
  value,
}: SelectParams<T>) {
  const valueByKey = (k: string) => options.find(({ key }) => key === k)!.value;

  return (
    <select
      className={className}
      value={options.find(({ value: val }) => value === val)?.key}
      onChange={(e) => onSelect(valueByKey(e.target.value))}
    >
      {options.map(({ key }, i) => (
        <option key={i} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}
