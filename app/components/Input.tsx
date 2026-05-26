type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
    />
  );
}
