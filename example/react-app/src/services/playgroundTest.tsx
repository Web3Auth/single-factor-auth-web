import { createContext, ReactNode, useMemo, useState } from "react";

export interface IPlaygroundTestContext {
  address: string;
  showRegisterPasskeyModal: boolean;
  toggleRegisterPasskeyModal: () => void;
}

interface IPlaygroundTestProps {
  children?: ReactNode;
}

export const PlaygroundTestContext = createContext<IPlaygroundTestContext>({
  address: "",
  showRegisterPasskeyModal: false,
  toggleRegisterPasskeyModal: async () => null,
});

function PlaygroundTest({ children }: IPlaygroundTestProps) {
  const [address] = useState<string>("");
  const [showRegisterPasskeyModal, setShowRegisterPasskeyModal] = useState<boolean>(false);

  const toggleRegisterPasskeyModal = () => {
    setShowRegisterPasskeyModal((prev) => !prev);
  };

  const contextProvider = useMemo(() => ({ address, showRegisterPasskeyModal, toggleRegisterPasskeyModal }), [address, showRegisterPasskeyModal]);

  return <PlaygroundTestContext.Provider value={contextProvider}>{children}</PlaygroundTestContext.Provider>;
}

export default PlaygroundTest;
