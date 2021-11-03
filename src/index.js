import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import chunks from 'lodash.chunk';
import { decodeTokenMetadata, getSolanaMetadataAddress } from './utils';
import { TOKEN_PROGRAM } from './config/solana';

export const createConnectionConfig = (
  clusterApi = clusterApiUrl('mainnet-beta'),
  commitment = 'confirmed'
) => new Connection(clusterApi, commitment);

export const getParsedNftAccountsByOwner = async (
  address,
  connection = createConnectionConfig(),
  serialization = true
) => {
  // TODO: Needs performace test
  // getParsedTokenAccountsByOwner vs getTokenAccountsByOwner + partial parsing
  // vs RPC getTokenAccountsByOwner with slice + partial parsing
  // vs RPC getProgramAccounts with slice and filter + partial parsing

  const { value: splAccounts } = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(address),
    {
      programId: new PublicKey(TOKEN_PROGRAM),
    }
  );

  const nftAccounts = splAccounts.filter(({ account }) => {
    const amount = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
    // const decimals = account?.data?.parsed?.info?.tokenAmount?.decimals;

    // TODO: We need to decide on this.
    // Here is correct way to do it described by Solana --->
    // filter out all SPL-tokens which isn't NFT
    // return decimals === 0 && amount >= 1;

    // Old collections like Solarians build with custom decimals and amount
    // prevents from using filter in correct way
    // Wallet with solarians
    // DmHhENyvzcjwtwQoR9uZc8QCSwXgk9tUqixDFD3pvGPB
    return amount > 0;
  });

  const acountsMetaAddressPromises = await Promise.allSettled(
    nftAccounts.map(({ account }) => {
      const address = account?.data?.parsed?.info?.mint;
      return address ? getSolanaMetadataAddress(new PublicKey(address)) : null;
    })
  );

  const acountsMetaAddress = acountsMetaAddressPromises
    .filter((result) => result && result.status === 'fulfilled')
    .map(({ value }) => value);

  const accountsRawMetaResponse = await Promise.allSettled(
    chunks(acountsMetaAddress, 99).map(async (chunk) => {
      try {
        return await connection.getMultipleAccountsInfo(chunk);
      } catch (err) {
        console.error(err);
      }
    })
  );

  const accountsRawMeta = accountsRawMetaResponse
    .filter(({ status }) => status === 'fulfilled')
    .flatMap(({ value }) => value);

  const accountsDecodedMeta = await Promise.allSettled(
    accountsRawMeta.map((accountInfo) => {
      return decodeTokenMetadata(accountInfo?.data);
    })
  );

  return accountsDecodedMeta
    .filter((result) => result && result.status === 'fulfilled')
    .map(({ value }) => (serialization ? sanitizeTokenMeta(value) : value));
};

const sanitizeTokenMeta = (tokenData) => {
  return {
    ...tokenData,
    data: {
      ...tokenData.data,
      name: sanitizeMetaStrings(tokenData?.data?.name),
      symbol: sanitizeMetaStrings(tokenData?.data?.symbol),
      uri: sanitizeMetaStrings(tokenData?.data?.uri),
    },
  };
};

export const sanitizeMetaStrings = (metaString) => {
  return metaString.replace(/\0/g, '');
};
