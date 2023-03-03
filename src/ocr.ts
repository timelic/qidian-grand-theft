import { createWorker } from "tesseract.js";

const defaultReplaceDict = {
  " ": "",
  "\n": "",
  "...": "…",
};

/**
 * @param img: Buffer
 * @return string
 * @description: 识别图片中的文字(一段话)
 */
export async function ocr(
  imgPath: string,
  replaceDict: Record<string, string> = defaultReplaceDict
) {
  const worker = await createWorker({
    // 设置 worker 数量
    // workerPath: "tesseract/worker.js",
    // 设置 logger
    // logger: (m) => console.log(m),
  });

  // await worker.load();
  await worker.loadLanguage("chi_sim");
  await worker.initialize("chi_sim");

  const { data } = await worker.recognize(imgPath);
  await worker.terminate();

  let text = data.text;
  // 替换文本
  for (const [key, value] of Object.entries(replaceDict)) {
    text = text.replaceAll(key, value);
  }

  return text;
}
