import React from "react";
import { MmrTier } from "@/firebase/mmrService";

interface TierIconProps {
  tier: MmrTier;
  className?: string;
}

export const TierIcon: React.FC<TierIconProps> = ({
  tier,
  className = "w-6 h-6 inline-block mr-1.5",
}) => {
  switch (tier) {
    case "Budlot":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
        </svg>
      );
    case "Budlotay":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
        </svg>
      );
    case "Maaramay":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
        </svg>
      );
    case "Maaram":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
          <circle cx="12" cy="12" r="4" strokeWidth={2.5} />
        </svg>
      );
    case "Makaritay":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l8 10-8 10-8-10 8-10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
        </svg>
      );
    case "Makarit":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l8 10-8 10-8-10 8-10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
          <circle cx="12" cy="12" r="3" strokeWidth={2.5} />
        </svg>
      );
    case "MakaritKaritan":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l8 10-8 10-8-10 8-10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
          <circle cx="12" cy="12" r="3" strokeWidth={2.5} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l4 4-4 4-4-4 4-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 18l4-4-4-4-4 4 4 4z"
          />
        </svg>
      );
    case "Gikakariti":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l8 10-8 10-8-10 8-10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2v20"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12h20"
          />
          <circle cx="12" cy="12" r="3" strokeWidth={2.5} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 2l4 4-4 4-4-4 4-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 18l4-4-4-4-4 4 4 4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M2 12l4-4 4 4-4 4-4-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M18 12l4-4 4 4-4 4-4-4z"
          />
        </svg>
      );
    default:
      return null;
  }
};
