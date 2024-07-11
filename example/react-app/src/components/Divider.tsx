type Props = {
  className?: string;
};

const Divider = ({ className }: Props) => {
  return <hr className={`h-px my-3 bg-app-gray-200 border-0 ${className}`} />;
};
export default Divider;
