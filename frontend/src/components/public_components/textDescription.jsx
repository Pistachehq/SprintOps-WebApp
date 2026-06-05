import React from "react";

const TextDescription = ({ text }) => {
  return (
    <p
      className="max-w-xl text-base md:text-lg text-[#64748b] font-medium leading-relaxed tracking-normal mt-4"
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {text}
    </p>
  );
};

export default TextDescription;
