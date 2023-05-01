import { unlink } from "fs/promises";

export async function deleteFile(path) {
  try {
    await unlink(path);
  } catch (e) {
    console.log("Error with deleting file", e.message);
  }
}
