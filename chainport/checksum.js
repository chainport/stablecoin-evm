const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Style
const bS = "\x1b[1m"; // Brightness start
const e = "\x1b[0m"; // End style
const u = "\x1b[4m"; // Underline
const positive = bS + "\x1b[32mTRUE ✅" + e;
const negative = bS + "\x1b[31mFALSE ❌" + e;
const metaHashSize = 106;
// Global vars
let valid = 0;
let invalid = 0;

const libraryNames = ["SignatureChecker"];

const compareBytecodes = async (
  contractAddress,
  contractName,
  libraryAddress
) => {
  const remoteByteCode = await hre.ethers.provider.getCode(contractAddress);
  const localByteCode = (await hre.artifacts.readArtifact(contractName))
    .deployedBytecode;

  if (libraryAddress) {
    return compareBytecode(
      remoteByteCode.substring(0, remoteByteCode.length - metaHashSize),
      localByteCode.substring(0, remoteByteCode.length - metaHashSize),
      libraryAddress.substring(2).toLowerCase(),
      contractName
    );
  } else {
    return (
      remoteByteCode.substr(0, remoteByteCode.length - metaHashSize) ===
      localByteCode.substr(0, remoteByteCode.length - metaHashSize)
    );
  }
};

function compareBytecode(remote, local, libraryAddress, contractName) {
  if (remote.length !== local.length) return false;
  let j;
  for (let i = 0; i < remote.length; i++) {
    if (local[i] === "_") {
      for (j = 0; j <= 38; j++) {
        if (remote[i + j] !== libraryAddress[j]) {
          return false;
        }
      }

      i = i + j + 1;
    }

    if (i === 4 && libraryNames.includes(contractName)) {
      for (j = 0; j <= 38; j++) {
        if (remote[i + j] !== libraryAddress[j]) {
          return false;
        }
      }

      i = i + j + 1;
    }

    if (remote[i] !== local[i]) {
      return false;
    }
  }

  return true;
}
const addr = (_addr) => {
  return bS + _addr + e;
};

const evalCheck = (condition) => {
  let msg;
  if (condition) {
    msg = positive;
    valid++;
  } else {
    msg = negative;
    invalid++;
  }
  return msg;
};

async function main() {
  await hre.run("compile");
  let json;
  try {
    // eslint-disable-next-line prefer-const
    json = fs.readFileSync(path.join(__dirname, `../chainport/addresses.json`));
  } catch (err) {
    json = "{}";
  }

  const parsedJSON = JSON.parse(json);

  const networkConfig = parsedJSON[hre.network.name];

  const tokenProxyAdmin = networkConfig.TokenProxyAdmin;
  const congress = networkConfig.ChainportCongress;
  const fiatTokenProxy = networkConfig.FiatTokenProxy;
  const fiatTokenV2_2 = networkConfig.FiatTokenV2_2;
  const masterMinter = networkConfig.MasterMinter;
  const signatureChecker = networkConfig.SignatureChecker;
  const security_operation_1 = networkConfig.security_operation_1;
  const security_operation_2 = networkConfig.security_operation_2;
  const chainportSideBridge = networkConfig.ChainportSideBridge;

  console.log(
    "\n" + "-".repeat(process.stdout.columns) + "\n".repeat(2) + "Proxy:",
    bS + "FiatTokenProxy" + e + "\n"
  );

  console.log(
    u + "Is Bytecode Matching:" + e,
    evalCheck(await compareBytecodes(fiatTokenProxy, "FiatTokenProxy")),
    "\n"
  );

  console.log(
    "\n" + "-".repeat(process.stdout.columns) + "\n".repeat(2) + "Proxy:",
    bS + "MasterMinter" + e + "\n"
  );

  console.log(
    u + "Is Bytecode Matching:" + e,
    evalCheck(await compareBytecodes(masterMinter, "MasterMinter")),
    "\n"
  );

  console.log(
    "\n" + "-".repeat(process.stdout.columns) + "\n".repeat(2) + "Proxy:",
    bS + "SignatureChecker" + e + "\n"
  );

  console.log(
    u + "Is Bytecode Matching:" + e,
    evalCheck(
      await compareBytecodes(
        signatureChecker,
        "SignatureChecker",
        signatureChecker.toLowerCase()
      )
    ),
    "\n"
  );

  console.log(
    "\n" + "-".repeat(process.stdout.columns) + "\n".repeat(2) + "Proxy:",
    bS + "FiatTokenV2_2" + e + "\n"
  );

  console.log(
    u + "Is Bytecode Matching:" + e,
    evalCheck(
      await compareBytecodes(
        fiatTokenV2_2,
        "FiatTokenV2_2",
        signatureChecker.toLowerCase()
      )
    ),
    "\n"
  );

  const tokenProxyInstance = await hre.ethers.getContractAt(
    "FiatTokenProxy",
    fiatTokenProxy
  );

  const remoteAdmin = await tokenProxyInstance.admin();

  console.log(
    u + `Admin:` + e,
    "\n" + " - Local:",
    addr(tokenProxyAdmin),
    "\n" + " - Remote:",
    addr(remoteAdmin),
    "\n" + " - Synced:",
    evalCheck(tokenProxyAdmin.toLowerCase() === remoteAdmin.toLowerCase()) +
      "\n"
  );

  const remoteImplementation = await tokenProxyInstance.implementation();

  console.log(
    u + `Token Implementation:` + e,
    "\n" + " - Local:",
    addr(fiatTokenV2_2),
    "\n" + " - Remote:",
    addr(remoteImplementation),
    "\n" + " - Synced:",
    evalCheck(
      fiatTokenV2_2.toLowerCase() === remoteImplementation.toLowerCase()
    ) + "\n"
  );

  const tokenInstance = await hre.ethers.getContractAt(
    "FiatTokenV2_2",
    fiatTokenProxy
  );

  const remoteOwner = await tokenInstance.owner();

  console.log(
    u + `Token Owner:` + e,
    "\n" + " - Local:",
    addr(congress),
    "\n" + " - Remote:",
    addr(remoteOwner),
    "\n" + " - Synced:",
    evalCheck(congress.toLowerCase() === remoteOwner.toLowerCase()) + "\n"
  );

  const remoteMasterMinter = await tokenInstance.masterMinter();

  console.log(
    u + `MasterMinter:` + e,
    "\n" + " - Local:",
    addr(masterMinter),
    "\n" + " - Remote:",
    addr(remoteMasterMinter),
    "\n" + " - Synced:",
    evalCheck(masterMinter.toLowerCase() === remoteMasterMinter.toLowerCase()) +
      "\n"
  );

  const remotePauser = await tokenInstance.pauser();

  console.log(
    u + `Pauser:` + e,
    "\n" + " - Local:",
    addr(security_operation_1),
    "\n" + " - Remote:",
    addr(remotePauser),
    "\n" + " - Synced:",
    evalCheck(
      security_operation_1.toLowerCase() === remotePauser.toLowerCase()
    ) + "\n"
  );

  const remoteBlacklister = await tokenInstance.blacklister();

  console.log(
    u + `Blacklister:` + e,
    "\n" + " - Local:",
    addr(security_operation_2),
    "\n" + " - Remote:",
    addr(remoteBlacklister),
    "\n" + " - Synced:",
    evalCheck(
      security_operation_2.toLowerCase() === remoteBlacklister.toLowerCase()
    ) + "\n"
  );

  const minterAllowance = await tokenInstance.minterAllowance(
    chainportSideBridge
  );

  console.log(
    u + `Minter Allowance:` + e,
    "\n" + " - ChainportSideBridge: " + minterAllowance + "\n"
  );

  const masterMinterInstance = await hre.ethers.getContractAt(
    "MasterMinter",
    masterMinter
  );

  const remoteMasterMinterOwner = await masterMinterInstance.owner();

  console.log(
    u + `Master Minter Owner:` + e,
    "\n" + " - Local:",
    addr(congress),
    "\n" + " - Remote:",
    addr(remoteMasterMinterOwner),
    "\n" + " - Synced:",
    evalCheck(
      congress.toLowerCase() === remoteMasterMinterOwner.toLowerCase()
    ) + "\n"
  );

  console.log(
    "\n" +
      "-".repeat(process.stdout.columns) +
      "\n".repeat(2) +
      bS +
      "\x1b[32mSuccessful:",
    valid,
    bS + "\t\x1b[31mFailed:",
    invalid + e + "\n"
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
