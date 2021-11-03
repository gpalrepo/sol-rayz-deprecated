const { deserializeUnchecked } = require('borsh');
const { PublicKey } = require('@solana/web3.js');
const {
  METADATA_SCHEMA,
  Metadata,
  METADATA_PREFIX,
  METADATA_PROGRAM,
} = require('./config/metaplex');

const extendBorsh = require('./config/borsh');

extendBorsh();

const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
const metaProgamPublicKeyBuffer = metaProgamPublicKey.toBuffer();
const metaProgamPrefixBuffer = Buffer.from(METADATA_PREFIX);

const decodeTokenMetadata = async (buffer) => {
  console.log(buffer);
  console.log(deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer));
  return deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
};

async function getSolanaMetadataAddress(tokenMint) {
  const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
  return (
    await PublicKey.findProgramAddress(
      [metaProgamPrefixBuffer, metaProgamPublicKeyBuffer, tokenMint.toBuffer()],
      metaProgamPublicKey
    )
  )[0];
}

module.exports = {
  decodeTokenMetadata,
  getSolanaMetadataAddress,
};
