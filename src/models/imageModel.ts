import { db } from "../db";
import { NotFoundError, BadRequestError } from "../expressError";
import { ImageData, PropertyData } from "../types";

/** Related functions for Images */
class Image {
  /** Create image entry in DB
   * Takes in a { key, propertyId}
   * Returns { key, propertyId }
   */

  // static async create({ key, propertyId }) {
  //   const result = await db.query(
  //     `INSERT INTO images (key, property_id)
  //       VALUES ($1, $2)
  //         RETURNING key, property_id AS "propertyId"
  //     `,
  //     [key, propertyId]
  //   );

  //   const image = result.rows[0];
  //   return image;
  // }
  /** Get all images by property id
   * throws NotFoundError if no property
   * Returns [{id,imageKey, isCoverImage}, ...] || []
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

    if (!property.rows[0])
      throw new NotFoundError(`No property: ${propertyId}`);

    const images = await db.query(
      `SELECT id, image_key AS "imageKey", is_cover_image AS "isCoverImage"
          FROM images
              WHERE property_id = $1
      `,
      [propertyId]
    );

    return images.rows;
  }

  // /** Delete image entry in DB by image key */
  // static async delete({ key }) {}
}

export { Image };