import { openMenu } from '@/components/MenuDrawer';
import { Search, Menu as MenuIcon } from 'lucide-react';
import RotateTitle from '@/components/RotateTitle';

const btn = 'glass press flex h-9 w-9 flex-none items-center justify-center rounded-full';

// Striscia fissa in alto: titolo animato (schede del dock) + cerca e menu. data-tabtitle: nel cambio scheda col dock questa riga resta ferma.
export default function FixedBar({ onSearch, title }) {
  return (
    <div data-tabtitle={title ? '1' : undefined} className="flex items-center justify-end gap-2 px-5 pb-1 pt-3">
      {title ? <RotateTitle title={title} /> : null}
      <button type="button" onClick={onSearch} aria-label="Cerca" className={btn}>
        <Search size={16} strokeWidth={2} />
      </button>
      <button type="button" onClick={openMenu} aria-label="Menu" className={btn}>
        <MenuIcon size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
