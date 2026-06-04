import React from "react";
import { useNavigate } from "react-router-dom";

const FilledButton = ({
  color,
  textColor = "#ffffff",
  text,
  path,
  onClick,
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={onClick || (() => navigate(path))}
      style={{ backgroundColor: color, color: textColor }}
      className="font-bold py-2 px-4 rounded-md shadow-md hover:opacity-90 transition-opacity"
    >
      {text}
    </button>
  );
};

export default FilledButton;
