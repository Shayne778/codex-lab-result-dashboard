const providerClass = {
  "Quest Diagnostics": "border-[var(--provider-quest)]/40 bg-[rgba(232,93,74,0.12)] text-[#ff9b8f]",
  LabCorp: "border-[var(--provider-labcorp)]/40 bg-[rgba(74,127,232,0.12)] text-[#9dbdff]",
  "Lee Health": "border-[var(--provider-leehealth)]/40 bg-[rgba(72,199,142,0.12)] text-[#9df0c8]",
};

export default function ProviderBadge({ provider }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium ${
        providerClass[provider] ?? "border-[var(--provider-other)]/40 bg-[rgba(155,110,243,0.12)] text-[#cbb7ff]"
      }`}
    >
      {provider}
    </span>
  );
}
