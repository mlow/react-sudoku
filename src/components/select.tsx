interface SelectParams<T> {
  options: { key: string; value: T }[];
  value?: T;
  onSelect: (value: T) => void;
  className?: string;
  name?: string;
  id?: string;
}

export function Select<T>({
  options,
  value,
  onSelect,
  className,
  name,
  id,
}: SelectParams<T>) {
  const valueByKey = (k: string) => options.find(({ key }) => key === k)!.value;

  return (
    <select
      className={className}
      name={name}
      id={id}
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
