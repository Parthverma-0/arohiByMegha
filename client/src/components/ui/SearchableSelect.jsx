import { useId, useMemo, useRef, useState } from 'react';

// Options marked `pinned` (e.g. "My city isn't listed") always stay at the bottom, whatever the search.
export default function SearchableSelect({ options, value, onChange, placeholder, disabled, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const id = useId();
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const starts = [];
    const contains = [];
    const pinned = [];
    for (const o of options) {
      const label = o.label.toLowerCase();
      if (o.pinned) pinned.push(o);
      else if (label.startsWith(q)) starts.push(o);
      else if (label.includes(q)) contains.push(o);
    }
    return [...starts, ...contains, ...pinned];
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  function choose(option) {
    onChange(option.value);
    close();
  }

  function moveTo(index) {
    setActive(index);
    listRef.current?.children[index]?.scrollIntoView({ block: 'nearest' });
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else moveTo(Math.min(active + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveTo(Math.max(active - 1, 0));
    } else if (e.key === 'Enter' && open && filtered[active]) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === 'Escape') {
      close();
    }
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${id}-${active}` : undefined}
        autoComplete="off"
        className="input-field pr-9"
        disabled={disabled}
        placeholder={open && selected ? selected.label : placeholder}
        value={open ? query : selected?.label || ''}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
      />
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/50"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
      {open && (
        <ul
          id={`${id}-list`}
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-charcoal/15 bg-white text-sm shadow-lg"
        >
          {filtered.length ? (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={o.value === value}
                // mousedown + preventDefault keeps the input focused so onBlur doesn't close the list before the pick lands.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2 ${i === active ? 'bg-blush' : ''} ${o.value === value ? 'font-medium' : ''} ${o.pinned ? 'text-charcoal/70 italic' : ''}`}
              >
                {o.label}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-charcoal/50">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}
