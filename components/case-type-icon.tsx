type CaseTypeIconProps = {
  type: string;
  className?: string;
};

export function CaseTypeIcon({ type, className }: CaseTypeIconProps) {
  const common = {
    className,
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  switch (type) {
    case "refund_missing":
    case "refund-missing":
      return (
        <svg {...common}>
          <path d="M7 7.5h8.5a3.5 3.5 0 0 1 0 7H9" />
          <path d="m10.5 4-3.5 3.5 3.5 3.5" />
          <path d="M12 11.5v6" />
          <path d="M9.5 15.5H14" />
        </svg>
      );
    case "delivery_missing":
    case "delivery-missing":
      return (
        <svg {...common}>
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5Z" />
          <path d="m4 7.5 8 4.5 8-4.5" />
          <path d="M12 12v9" />
          <path d="M16.5 5 8.7 9.4" />
        </svg>
      );
    case "product_problem":
    case "product-problem":
      return (
        <svg {...common}>
          <path d="M12 3 3.5 19h17Z" />
          <path d="M12 9v4.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "cancellation_ignored":
    case "cancellation-ignored":
      return (
        <svg {...common}>
          <path d="M6 4h9l3 3v13H6Z" />
          <path d="M15 4v3h3" />
          <path d="m9 11 6 6" />
          <path d="m15 11-6 6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6Z" />
          <path d="M15 3v3h3" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
  }
}
