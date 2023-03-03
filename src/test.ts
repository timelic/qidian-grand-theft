import Tesseract from "tesseract.js";

Tesseract.recognize("output/test.png", "chi_sim", {
  logger: (m) => console.log(m),
}).then(({ data: { text } }) => {
  console.log({ text: text.replaceAll("\n", "").replaceAll(" ", "") });
});
