import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getExtension(file: File) {
  const provided = path.extname(file.name).toLowerCase();
  if (provided) return provided;

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

async function saveImage(file: File, folder: string) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Format d'image non supporté. Utilisez JPG, PNG, WEBP ou GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image trop volumineuse. Limite: 5 Mo.");
  }

  const ext = getExtension(file);
  const relativeDir = path.join("uploads", folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const absolutePath = path.join(absoluteDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;
}

export async function uploadOptionalImage(
  file: FormDataEntryValue | null,
  folder: string
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return saveImage(file, folder);
}

export async function uploadManyImages(
  files: FormDataEntryValue[],
  folder: string
) {
  const validFiles = files.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  const uploaded: string[] = [];
  for (const file of validFiles) {
    uploaded.push(await saveImage(file, folder));
  }
  return uploaded;
}
