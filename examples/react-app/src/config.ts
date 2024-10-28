const config = {
  nftCheckoutHost: import.meta.env.VITE_APP_NFT_CHECKOUT_HOST,
  nftCheckoutApiKey: import.meta.env.VITE_APP_NFT_CHECKOUT_API_KEY,
};

export const getDefaultBundlerUrl = (chainId: string): string => {
  return `https://api.pimlico.io/v2/${Number(chainId)}/rpc?apikey=${import.meta.env.VITE_APP_PIMLICO_API_KEY}`;
};

export default config;
