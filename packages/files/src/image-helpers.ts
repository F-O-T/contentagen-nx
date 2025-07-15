import sharp from "sharp";

export async function compressImage(
   inputBuffer: Buffer,
   options: {
      format?: "jpeg" | "png" | "webp" | "avif";
      quality?: number;
   } = {},
): Promise<Buffer> {
   const format = options.format || "jpeg";
   const quality = options.quality || 80;
   let image = sharp(inputBuffer);
   switch (format) {
      case "jpeg":
         image = image.jpeg({ quality });
         break;
      case "png":
         image = image.png({ quality });
         break;
      case "webp":
         image = image.webp({ quality });
         break;
      case "avif":
         image = image.avif({ quality });
         break;
      default:
         image = image.jpeg({ quality });
   }
   return await image.toBuffer();
}
