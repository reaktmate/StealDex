interface Props {
  label: string;
  tier: number;
}

/** 色だけに頼らないよう、必ず文字のラベルを添える */
export function RarityBadge({ label, tier }: Props) {
  return (
    <span className="rarity-badge" data-tier={tier}>
      <span className="rarity-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
