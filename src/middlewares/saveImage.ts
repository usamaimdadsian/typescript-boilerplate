const sharp = require('sharp')
const multer = require('multer')

const storage = multer.memoryStorage()
const uploads = multer({storage})

const saveImage = (schema) => (req, res, next) => {
  uploads.single('image')
  // console.log(req.file,'image files')
  // await sharp(req.image.buffer).resize()
  return next()
};

export default saveImage