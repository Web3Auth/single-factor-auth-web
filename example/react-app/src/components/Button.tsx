type BaseButtonAttributes = React.ComponentPropsWithoutRef<"button">;

interface ButtonProps extends BaseButtonAttributes {}

const Button = (props: ButtonProps) => {
  const { children, className } = props;

  return (
    <button
      {...props}
      className={`flex
        rounded-md
        h-[42px]
        px-5
        py-2.5
        text-sm
        items-center
        justify-center
        ease-linear
        transition-all
        duration-150
        outline-none
        bg-transparent
        text-app-gray-800
        border
        border-app-gray-300
        hover:bg-app-gray-200
        active:bg-transparent
        active:border-app-primary-600
        active:ring-1
        active:ring-app-primary-600
        focus-visible:border-app-primary-600
        focus-visible:bg-transparent
        focus-visible:ring-1
        focus-visible:ring-app-primary-600
    ${className}`}
    >
      {children}
    </button>
  );
};
export default Button;
