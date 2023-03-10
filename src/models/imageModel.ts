import { db } from "../db";
import { NotFoundError } from "../expressError";
import { ImageData } from "../types";

/** Related functions for Images */
class Image {
  /** Create image entry in DB
   * Takes in a { imageKey, propertyId, isCoverImage }
   * Returns { id, imageKey, propertyId, isCoverImage }
   */
  static async create({
    imageKey,
    propertyId,
    isCoverImage = false,
  }: Omit<ImageData, "id">): Promise<ImageData> {
    const result = await db.query(
      `INSERT INTO images (image_key , property_id, is_cover_image)
          VALUES ($1, $2, $3)
              RETURNING id,
                        image_key AS "imageKey",
                        property_id AS "propertyId",
                        is_cover_image AS "isCoverImage"
      `,
      [imageKey, propertyId, isCoverImage]
    );

    const image: ImageData = result.rows[0];
    return image;
  }

  /** Get all images by property id
   * Throws NotFoundError if no property
   * Returns [{id, imageKey, isCoverImage}, ...] or [] if no images
   */
  static async getAllByProperty(
    propertyId: number
  ): Promise<Omit<ImageData, "propertyId">[]> {
    const property = await db.query(
      `SELECT id
          FROM properties
            WHERE id = $1
          `,
      [propertyId]
    );
    NotFoundError.handler(property.rows[0], `No property: ${propertyId}`);

    const images = await db.query(
      `SELECT id, image_key AS "imageKey", is_cover_image AS "isCoverImage"
          FROM images
              WHERE property_id = $1
      `,
      [propertyId]
    );
    const imageData: Omit<ImageData, "propertyId">[] = images.rows;

    return imageData;
  }

  /** Delete image from DB by image imageKey
   * Throws NotFoundError if no imageKey exists
   *
   * Returns undefined on success
   */
  static async delete({ imageKey }: Pick<ImageData, "imageKey">) {
    const result = await db.query(
      `DELETE FROM images
          WHERE image_key = $1
              RETURNING image_key AS "imageKey"
      `,
      [imageKey]
    );
    const image: Pick<ImageData, "imageKey"> = result.rows[0];
    NotFoundError.handler(image, `No image: ${imageKey}`);

    return;
  }

  /** Update isCoverImage to TRUE by id
   * Finds current image with isCoverImage TRUE by property id and toggles FALSE
   * Takes an image id, and changes isCoveredImage to TRUE
   * Throws a new NotFoundError if no image id
   * Returns image object {id, imageKey, propertyId, isCoverImage}
   */
  static async update({
    id,
    propertyId,
  }: Pick<ImageData, "id" | "propertyId">): Promise<ImageData> {
    await db.query(
      `UPDATE images
          SET is_cover_image = FALSE
              WHERE is_cover_image = TRUE AND property_id = $1`,
      [propertyId]
    );

    const image = await db.query(
      `UPDATE images
          SET is_cover_image = TRUE
              WHERE id = $1
                RETURNING id,
                          image_key AS "imageKey",
                          property_id AS "propertyId",
                          is_cover_image AS "isCoverImage"
              `,
      [id]
    );
    const coverImage: ImageData = image.rows[0];
    NotFoundError.handler(coverImage, `No image: ${id}`);

    return coverImage;
  }
}

export { Image };
