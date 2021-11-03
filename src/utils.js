import { deserializeUnchecked } from 'borsh';
import { PublicKey } from '@solana/web3.js';
import {
  METADATA_SCHEMA,
  Metadata,
  METADATA_PREFIX,
  METADATA_PROGRAM,
} from './config/metaplex';

import { extendBorsh } from './config/borsh';

extendBorsh();

const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
const metaProgamPublicKeyBuffer = metaProgamPublicKey.toBuffer();
const metaProgamPrefixBuffer = Buffer.from(METADATA_PREFIX);

export const decodeTokenMetadata = async (buffer) => {
  return deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
};

export async function getSolanaMetadataAddress(tokenMint) {
  const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
  return (
    await PublicKey.findProgramAddress(
      [metaProgamPrefixBuffer, metaProgamPublicKeyBuffer, tokenMint.toBuffer()],
      metaProgamPublicKey
    )
  )[0];
}
