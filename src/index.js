const { chromium } = require("playwright");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
// const { rl} = require("readline");

const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function downloadAndSaveImage(url, folderName, index) {
  try {
    // caca.com/imagen.jpg
    const filename = url.split("/").pop();
    let extension = filename.split(".").pop();
    const validExtensions = ["jpg", "png", "gif", "jpeg"];
    if (!validExtensions.includes(extension)) {
      extension = "jpg";
    }

    // Directorio donde se guardará la imagen
    const folder = path.resolve("tmp", folderName);

    // Nombre de archivo para guardar la imagen
    const nombreArchivo = index + "." + extension;

    // Ruta completa del archivo de destino
    const rutaArchivo = path.resolve(folder, nombreArchivo);

    // Verificar si la carpeta "tmp" existe y, si no, crearla
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Descargar la imagen y guardarla en el directorio "tmp"
    const response = await axios.get(url, { responseType: "stream" });
    response.data.pipe(fs.createWriteStream(rutaArchivo));

    return `Imagen descargada y guardada en ${rutaArchivo}`;
  } catch (error) {
    throw new Error(`Error al descargar la imagen: ${error.message}`);
  }
}

async function searchAndDownloadImage({ searchText, quantity }) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.google.com/");

  const textarea = await page.$("textarea");
  await textarea.fill(searchText);

  await page.click("text=Buscar con Google");

  await page.click("text=Imágenes");

  const imagesContainer = await page.waitForSelector('[jsname="r5xl4"]');

  let imagesDivs = await imagesContainer.$$('[role="listitem"]');
  imagesDivs = imagesDivs.slice(0, quantity);

  let i = 0;
  for (const div of imagesDivs) {
    try {
      await div.click();
      const imageEl = await page.waitForSelector('[jsname="kn3ccd"]', {
        timeout: 3000,
      });
      const url = await imageEl.getAttribute("src");
      console.log({ url });
      await downloadAndSaveImage(url, searchText, i);
      i++;
    } catch (err) {
      console.log("No se pudo descargar la imagen");
    }
  }
}

rl.question("¿Qué quieres buscar? ", async (searchText) => {
  rl.question(
    "Qué cantidad de imágenes quieres descargar? ",
    async (quantity) => {
      await searchAndDownloadImage({
        searchText,
        quantity: Number(quantity),
      });
      rl.close();
    }
  );
});
