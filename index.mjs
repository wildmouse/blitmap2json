import ethers from "ethers"
import {program} from "commander"
import dotenv from "dotenv"
dotenv.config()

program
    .version("1.0.0")
    .requiredOption("-i --tokenId <number>", "token id to fetch token data");

program.parse(process.argv);

const options = program.opts();

if (!Number.isInteger(parseInt(options.tokenId))) {
    throw new Error("token id must be number");
}

const blitmapABI = [
    {
        inputs: [{internalType: "uint256", name: "tokenId", type: "uint256"}],
        name: "tokenDataOf",
        outputs: [{internalType: "bytes", name: "", type: "bytes"}],
        stateMutability: "view",
        type: "function",
    },
];

const blitmap = new ethers.Contract(
    "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
    new ethers.utils.Interface(blitmapABI),
    new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    )
);

const parsed = await blitmap.tokenDataOf(options.tokenId).then((tokenData) => {
    if (tokenData === undefined || tokenData.length !== 538) {
        return;
    }
    const body = tokenData.slice(2, tokenData.length);
    if (!/^[A-F0-9]+$/i.test(body)) {
        return;
    }

    const colors = [];
    for (let i = 0; i < 4; i++) {
        colors.push(`#${body.slice(6 * i, 6 * (i + 1))}`);
    }

    const pixelColorMapping = [];
    for (let i = 24; i < 536; i += 16) {
        const row = body.slice(i, i + 16);
        const rowPixelColors = [];
        for (let j = 0; j < 16; j++) {
            const pixels = row.slice(j, j + 1);
            const binary = parseInt(pixels, 16).toString(2).padStart(4, "0");
            rowPixelColors.push(
                ...[parseInt(binary.slice(0, 2), 2), parseInt(binary.slice(2, 4), 2)]
            );
        }
        pixelColorMapping.push(rowPixelColors);
    }

    return {
        colors,
        pixelColorMapping,
    };
});

console.log(JSON.stringify(parsed));
