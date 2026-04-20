export const Button = ({
  active,
  text,
  children,
  onClick,
}: {
  active?: boolean;
  text?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-[60px] h-[40px]"
      css={{
        border: "solid 1px #888",
        backgroundColor: active ? "#ddd" : "#fff",
        borderRadius: "999px",
        cursor: "pointer",
      }}
    >
      {text && <span>{text}</span>}
      {children}
    </button>
  );
};
