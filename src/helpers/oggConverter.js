import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { createWriteStream } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { deleteFile } from "./deleteFile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);
      return new Promise((res, rej) => {
        ffmpeg(input)
          .inputOption("-t 30")
          .output(outputPath)
          .on("end", () => {
            deleteFile(input);
            res(outputPath);
          })
          .on("error", (err) => rej(err.message))
          .run();
      });
    } catch (e) {
      console.log("Error with creating mp3", e.message);
    }
  }

  async create(url, fileName) {
    try {
      const oggPath = resolve(__dirname, "../voices", `${fileName}.ogg`);
      const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
      });
      return new Promise((res) => {
        const stream = createWriteStream(oggPath);
        response.data.pipe(stream);
        stream.on("finish", () => res(oggPath));
      });
    } catch (e) {
      ctx.reply('Сорри, ошибка, обратитесь к разрабу ;(');
      console.log("Error with creating ogg", e.message);
    }
  }
}

export const ogg = new OggConverter();
