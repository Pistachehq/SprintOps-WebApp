const CustomBadge = ({ backgroundColor, textColor, text }) => {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase select-none"
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    >
      <span className="w-2 h-2 rounded-full bg-[#4ea1a1]" />
      <span>{text}</span>
    </div>
  );
};

export default CustomBadge;
