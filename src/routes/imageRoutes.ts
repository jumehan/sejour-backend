import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import { UnauthorizedError } from "../expressError";
import { uploadImage } from "../helpers/awsS3";
import { upload } from "../helpers/fileServices";
import {
  ensureLoggedIn,
  ensureUserIsPropertyOwner,
} from "../middleware/authMiddleware";
import { Image } from "../models/imageModel";
import { Property } from "../models/propertyModel";
const router: Router = express.Router({ mergeParams: true });

/** POST /property/:id/image
 * Create Image
 * Takes in a { imageKey, propertyId, isCoverImage }
 *  Returns [{ id, imageKey, propertyId, isCoverImage },
 *            { error: `Error uploading ${filename}` }... ]
 */
router.post(
  "/",
  ensureLoggedIn,
  ensureUserIsPropertyOwner,
  upload.array("files", 12),
  async function (req, res, next) {
    const id = +req.params.id;

    const files = req.files as Express.Multer.File[];
    const keys = files.map((_file) => randomUUID());

    const promises = files.map((file, index) =>
      uploadImage(keys[index], file.buffer, id)
    );

    const results = await Promise.allSettled(promises);

    const images = results.map(async (result, index) => {
      if (result.status === "rejected") {
        const filename = files[index].filename;
        return { error: `Error uploading ${filename}` };
      }

      const image = await Image.create({
        imageKey: keys[index],
        propertyId: id,
      });
      return image;
    });

    return res.status(201).json({ images });
  }
);
export { router as imageRoutes };