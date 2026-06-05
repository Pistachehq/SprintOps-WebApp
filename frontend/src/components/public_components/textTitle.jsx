import React from "react";

const TextTitle = ({ mainText, highlightText }) => {
  return (
    <h1
      className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#1c1b29] leading-[1.15]"
      style={{
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
      }}
    >
      {mainText}{" "}
      {highlightText && (
        <span
          className="block sm:inline text-[#4db6ac] italic font-normal"
          style={{ fontFamily: "Georgia, Cambria, serif" }}
        >
          {highlightText}
        </span>
      )}
    </h1>
  );
};

export default TextTitle;
