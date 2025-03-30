import { FormEvent, ReactNode } from "react";

interface AuthFormProps {
  title: string;
  submitText: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthForm({
  title,
  submitText,
  onSubmit,
  children,
  footer,
}: AuthFormProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
      <div className="max-w-md w-full px-6 text-center space-y-10">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="plann.er" />
          <h2 className="text-zinc-300 text-lg font-medium">{title}</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <button
            type="submit"
            className="w-full bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium hover:bg-lime-400"
          >
            {submitText}
          </button>
        </form>

        <div className="text-sm text-zinc-500">{footer}</div>
      </div>
    </div>
  );
}
