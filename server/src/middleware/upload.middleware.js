const fs = require('fs')
const path = require('path')
const multer = require('multer')

const avatarsDirectory = path.join(
  __dirname,
  '../../uploads/avatars',
)

const productsDirectory = path.join(
  __dirname,
  '../../uploads/products',
)

const categoriesDirectory = path.join(
  __dirname,
  '../../uploads/categories',
)

const messagesDirectory = path.join(
  __dirname,
  '../../uploads/messages',
)

const scopedUploadDirectories = {
  products: productsDirectory,
  categories: categoriesDirectory,
  messages: messagesDirectory,
}

const uploadDirectories = [
  avatarsDirectory,
  productsDirectory,
  categoriesDirectory,
  messagesDirectory,
]

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

for (const directory of uploadDirectories) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }
}

function getSafeExtension(file) {
  const mimeExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }

  return (
    mimeExtensions[file.mimetype] ||
    path.extname(file.originalname).toLowerCase()
  )
}

function makeSafeFilename(prefix, file) {
  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 10)

  return `${prefix}-${Date.now()}-${randomPart}${getSafeExtension(file)}`
}

function ensureUploadDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }
}

function createImageStorage({
  directory,
  prefix,
}) {
  return multer.diskStorage({
    destination: (
      _req,
      _file,
      callback,
    ) => {
      ensureUploadDirectory(directory)

      callback(
        null,
        directory,
      )
    },

    filename: (
      req,
      file,
      callback,
    ) => {
      const resolvedPrefix =
        typeof prefix === 'function'
          ? prefix(req, file)
          : prefix

      callback(
        null,
        makeSafeFilename(
          resolvedPrefix,
          file,
        ),
      )
    },
  })
}

const adminImageStorage = multer.diskStorage({
  destination: (
    req,
    _file,
    callback,
  ) => {
    const scope =
      String(req.params.scope || '').trim()

    const directory =
      scopedUploadDirectories[scope]

    if (!directory) {
      const error =
        new Error(
          'Type de dossier image invalide.',
        )

      error.statusCode = 400

      callback(error)
      return
    }

    ensureUploadDirectory(directory)

    callback(
      null,
      directory,
    )
  },

  filename: (
    req,
    file,
    callback,
  ) => {
    const scope =
      String(req.params.scope || 'admin')

    const userId =
      req.user?.id || 'system'

    callback(
      null,
      makeSafeFilename(
        `${scope}-${userId}`,
        file,
      ),
    )
  },
})

const avatarStorage = createImageStorage({
  directory: avatarsDirectory,
  prefix: (req) => `avatar-${req.user.id}`,
})

const fileFilter = (
  _req,
  file,
  callback,
) => {
  if (
    !allowedMimeTypes.includes(
      file.mimetype,
    )
  ) {
    const error =
      new Error(
        'Format d image non autorise. Utilisez JPG, PNG ou WebP.',
      )

    error.statusCode = 400

    callback(
      error,
      false,
    )

    return
  }

  callback(
    null,
    true,
  )
}

function removeUploadedFile(filePath) {
  if (!filePath) {
    return
  }

  const resolvedPath =
    path.resolve(filePath)

  const isInUploadDirectory =
    uploadDirectories.some((directory) =>
      resolvedPath.startsWith(
        path.resolve(directory),
      ),
    )

  if (!isInUploadDirectory) {
    return
  }

  if (fs.existsSync(resolvedPath)) {
    try {
      fs.unlinkSync(resolvedPath)
    } catch (error) {
      console.error(
        'Impossible de supprimer le fichier upload :',
        error.message,
      )
    }
  }
}

const uploadAvatar = multer({
  storage: avatarStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
})

const uploadAdminImages = multer({
  storage: adminImageStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },

  fileFilter,
})

module.exports = {
  uploadAvatar,
  uploadAdminImages,
  avatarsDirectory,
  scopedUploadDirectories,
  removeUploadedFile,
}
