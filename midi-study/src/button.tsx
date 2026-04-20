export const Button = ({
  active,
  text,
  children,
  onClick,
  disabled,
}: {
  active?: boolean;
  text?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-w-[60px] h-[40px]"
      css={{
        border: "solid 1px #888",
        backgroundColor: active ? "#ccffcc" : "#fff",
        borderRadius: "999px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {text && <span>{text}</span>}
      {children}
    </button>
  );
};
