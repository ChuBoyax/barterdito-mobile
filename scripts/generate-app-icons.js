
const path = require('path');
const Jimp = require('jimp-compact');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/images/barterdito-symbol.png');
const OUT = (name) => path.join(ROOT, 'assets/images', name);

const YELLOW = 0xffcd57ff; // brand.yellow
const SIZE = 1024;

async function symbol(size) {
  const image = await Jimp.read(SOURCE);
  image.autocrop({ cropOnlyFrames: false, tolerance: 0.0002 });
  return image.contain(size, size);
}

function canvas(color = 0x00000000) {
  return new Jimp(SIZE, SIZE, color);
}

function centered(base, layer) {
  return base.composite(layer, (SIZE - layer.bitmap.width) / 2, (SIZE - layer.bitmap.height) / 2);
}


function tint(image, [r, g, b]) {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_x, _y, idx) => {
    image.bitmap.data[idx] = r;
    image.bitmap.data[idx + 1] = g;
    image.bitmap.data[idx + 2] = b;
  });
  return image;
}

function circle(diameter, color) {
  const image = new Jimp(diameter, diameter, 0x00000000);
  const radius = diameter / 2;
  image.scan(0, 0, diameter, diameter, (x, y) => {
    const distance = Math.hypot(x + 0.5 - radius, y + 0.5 - radius);
    if (distance <= radius) image.setPixelColor(color, x, y);
  });
  return image;
}

async function main() {
 
  const icon = centered(canvas(YELLOW), await symbol(600));
  await icon.writeAsync(OUT('icon.png'));
  await icon.clone().resize(48, 48).writeAsync(OUT('favicon.png'));

 
  await canvas(YELLOW).writeAsync(OUT('android-icon-background.png'));
  await centered(canvas(), await symbol(440)).writeAsync(OUT('android-icon-foreground.png'));
  await centered(canvas(), tint(await symbol(440), [255, 255, 255])).writeAsync(OUT('android-icon-monochrome.png'));

  
  await centered(centered(canvas(), circle(SIZE, YELLOW)), await symbol(580)).writeAsync(OUT('splash-icon.png'));

  console.log('App icons generated in assets/images/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
